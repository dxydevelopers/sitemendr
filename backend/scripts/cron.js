const { runSuspensionAutomation } = require('./suspensionAutomation');
const { verifyDomains } = require('./dnsWorker');
const { provisionSSL } = require('./sslWorker');
const { monitorUptime } = require('./uptimeWorker');
const { connectDB } = require('../config/db');
const logger = require('../config/logger');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const runCron = async () => {
  logger.info('Starting daily cron job');
  
  try {
    // Ensure DB connection
    await connectDB();
    
    // Run suspension automation
    const suspensionResult = await runSuspensionAutomation();
    
    // Run DNS verification
    await verifyDomains();
    
    // Run SSL provisioning
    await provisionSSL();
    
    // Run Uptime monitoring
    await monitorUptime();
    
    logger.info('Cron job completed successfully', {
      errorCode: 'CRON_COMPLETED',
      suspension: suspensionResult
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Cron job failed', {
      errorCode: 'CRON_FAILED',
      error: error.message
    });
    process.exit(1);
  }
};

runCron();
