const axios = require('axios');
const { prisma } = require('../config/db');
const logger = require('../config/logger');

/**
 * Uptime Worker - Monitors active websites and logs status
 */
async function monitorUptime() {
  logger.info('Starting Uptime Monitoring Worker');
  
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        domain: { not: null }
      },
      select: {
        id: true,
        domain: true,
        siteName: true
      }
    });

    logger.info(`Monitoring ${subscriptions.length} active nodes`);

    for (const sub of subscriptions) {
      const url = sub.domain.startsWith('http') ? sub.domain : `https://${sub.domain}`;
      const start = Date.now();
      
      try {
        const response = await axios.get(url, { timeout: 10000 });
        const latency = Date.now() - start;
        
        // Update subscription with latest health data
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            performanceData: {
              ...(sub.performanceData || {}),
              lastChecked: new Date().toISOString(),
              status: 'UP',
              latency,
              statusCode: response.status
            }
          }
        });
      } catch (err) {
        logger.warn(`Node ${sub.id} (${sub.domain}) is DOWN: ${err.message}`);
        
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            performanceData: {
              ...(sub.performanceData || {}),
              lastChecked: new Date().toISOString(),
              status: 'DOWN',
              error: err.message
            }
          }
        });
        
        // Potential for automated credit calculation here if downtime exceeds SLA
      }
    }

    logger.info('Uptime monitoring cycle complete');
  } catch (error) {
    logger.error('Uptime Worker Error', {
      errorCode: 'UPTIME_WORKER_ERROR',
      error: error.message
    });
  }
}

if (require.main === module) {
  monitorUptime()
    .then(() => process.exit(0))
    .catch(err => {
      logger.error('Uptime Worker Startup Error', { error: err.message });
      process.exit(1);
    });
}

module.exports = { monitorUptime };
