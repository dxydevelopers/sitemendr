const { runSuspensionAutomation } = require('../scripts/suspensionAutomation');
const { verifyDomains } = require('../scripts/dnsWorker');
const { provisionSSL } = require('../scripts/sslWorker');
const logger = require('../config/logger');
const { isDbConnected } = require('../config/db');

/**
 * Initialize automated operational tasks
 */
exports.initAutomation = () => {
  logger.info('Initializing operational automation service');

  // Run initial audits on startup
  runSuspensionAutomation().catch(err => {
    logger.error('Initial suspension automation run failed', { error: err.message });
  });

  verifyDomains().catch(err => {
    logger.error('Initial DNS verification failed', { error: err.message });
  });

  provisionSSL().catch(err => {
    logger.error('Initial SSL provisioning run failed', { error: err.message });
  });

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  
  setInterval(async () => {
    logger.info('Starting scheduled daily operational tasks');
    
    try {
      // 1. Subscription & Suspension Audit
      const suspensionResults = await runSuspensionAutomation();
      logger.info('Suspension audit completed', suspensionResults);

      // 2. DNS Audit
      await verifyDomains();
      logger.info('DNS Audit completed');

      // 3. SSL Renewal/Provisioning Audit
      await provisionSSL();
      logger.info('SSL Audit completed');

      // 4. Maintenance Audit
      await runMaintenanceAudit();

    } catch (error) {
      logger.error('Scheduled operational tasks failed', { error: error.message });
    }
  }, TWENTY_FOUR_HOURS);
};

async function runMaintenanceAudit() {
  logger.info('Starting system maintenance audit');
  
  try {
    const { prisma } = require('../config/db');
    const now = new Date();

    // 1. Clear expired assessments (older than 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const deletedAssessments = await prisma.assessment.deleteMany({
      where: {
        createdAt: { lt: sevenDaysAgo },
        status: { not: 'completed' }
      }
    });
    if (deletedAssessments.count > 0) {
      logger.info(`Cleaned up ${deletedAssessments.count} expired assessments`);
    }

    // 2. Clear old system messages (older than 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        createdAt: { lt: thirtyDaysAgo },
        isRead: true
      }
    });
    if (deletedMessages.count > 0) {
      logger.info(`Cleaned up ${deletedMessages.count} old read messages`);
    }

    // 3. Verify subscription health
    const activeSubscriptions = await prisma.subscription.findMany({
      where: { status: 'active' },
      select: { id: true, expiresAt: true }
    });

    for (const sub of activeSubscriptions) {
      if (sub.expiresAt && sub.expiresAt < now) {
        // This shouldn't happen if suspension automation works, but good as a double check
        logger.warn(`Found active but expired subscription ${sub.id}, flagging for review`);
      }
    }

    logger.info('Maintenance Audit executed successfully');
  } catch (error) {
    logger.error('Maintenance Audit failed', { error: error.message });
  }
}

