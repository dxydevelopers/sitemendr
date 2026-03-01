const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');

let dbConnected = false;

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

/**
 * Connect to the database using Prisma
 */
const connectDB = async (retries = 5) => {
  while (retries > 0) {
    try {
      await prisma.$connect();
      dbConnected = true;
      logger.info('PostgreSQL (Supabase) connected successfully via Prisma');
      return true; // Success
    } catch (err) {
      retries--;
      logger.error('Database connection error', { 
        errorCode: 'DB_CONNECTION_RETRY_ERROR',
        retriesLeft: retries,
        error: err.message 
      });
      
      if (retries > 0) {
        logger.info('Waiting 5 seconds before retrying...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      } else {
        logger.error('All database connection retries failed', { errorCode: 'DB_CONNECTION_CRITICAL_FAILURE' });
        logger.warn('Server will continue in degraded mode (some features may not work)');
        dbConnected = false;
        return false; // Failed
      }
    }
  }
};

/**
 * Disconnect from the database
 */
const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    dbConnected = false;
    logger.info('Database connection closed');
  } catch (err) {
    logger.error('Error disconnecting from database', {
      errorCode: 'DB_DISCONNECT_ERROR',
      error: err.message
    });
  }
};

// Handle process termination for graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  prisma,
  isDbConnected: () => dbConnected, 
  // Temporary shim for backward compatibility during migration
  getDb: () => {
    logger.warn('DEPRECATED: getDb() called. Migration to Prisma required.');
    return null; 
  } 
};






