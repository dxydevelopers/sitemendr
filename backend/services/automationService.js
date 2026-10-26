const { runSuspensionAutomation } = require('../scripts/suspensionAutomation');
const { verifyDomains } = require('../scripts/dnsWorker');
const { provisionSSL } = require('../scripts/sslWorker');
const { monitorUptime } = require('../scripts/uptimeWorker');
const logger = require('../config/logger');
const { isDbConnected } = require('../config/db');
const {
  runInvoiceReminders,
  reconcileCompletedPaymentBillingRecords,
  reconcilePayableBuildInvoices
} = require('./billingRecords');
const { reconcileCompletedPerformancePayments, reconcileCompletedRepairPayments } = require('./paymentService');
const { runRepairReviewReminders } = require('./repairAutomation');
const { UPTIME_CHECK_INTERVAL_MINUTES, AVAILABILITY_HISTORY_RETENTION_DAYS } = require('./performancePolicy');

/**
 * Initialize automated operational tasks
 */
exports.initAutomation = async () => {
  logger.info('Initializing operational automation service');

  try {
    // Run initial audits sequentially on startup to avoid connection bursts
    logger.info('Running initial suspension audit...');
    await runSuspensionAutomation();

    logger.info('Running initial DNS verification...');
    await verifyDomains();

    logger.info('Running initial SSL provisioning...');
    await provisionSSL();

    logger.info('Running initial client-site availability monitoring...');
    await monitorUptime();

    logger.info('Applying Performance availability history retention policy...');
    await cleanupAvailabilityHistory();

    logger.info('Reconciling completed payment billing records...');
    await reconcileCompletedPaymentBillingRecords();
    logger.info('Reconciling completed Performance payments...');
    await reconcileCompletedPerformancePayments();
    logger.info('Reconciling completed Repair payments...');
    await reconcileCompletedRepairPayments();
    await runRepairReviewReminders();
    await reconcilePayableBuildInvoices();

    logger.info('Running initial billing reminder pass...');
    await runInvoiceReminders();

    logger.info('Initial background tasks completed successfully');
  } catch (err) {
    logger.error('One or more initial automation tasks failed', { 
      errorCode: 'AUTOMATION_STARTUP_ERROR',
      error: err.message 
    });
  }

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const DOMAIN_CHECK_INTERVAL = 15 * 60 * 1000;
  const HTTPS_CHECK_INTERVAL = 30 * 60 * 1000;
  const UPTIME_CHECK_INTERVAL = UPTIME_CHECK_INTERVAL_MINUTES * 60 * 1000;
  const BILLING_REMINDER_INTERVAL = 60 * 60 * 1000;

  const dnsTimer = setInterval(async () => {
    try {
      await verifyDomains();
    } catch (error) {
      logger.error('Scheduled DNS verification failed', { error: error.message });
    }
  }, DOMAIN_CHECK_INTERVAL);
  dnsTimer.unref();

  const httpsTimer = setInterval(async () => {
    try {
      await provisionSSL();
    } catch (error) {
      logger.error('Scheduled HTTPS readiness check failed', { error: error.message });
    }
  }, HTTPS_CHECK_INTERVAL);
  httpsTimer.unref();

  const uptimeTimer = setInterval(async () => {
    try {
      await monitorUptime();
    } catch (error) {
      logger.error('Scheduled client-site availability monitoring failed', { error: error.message });
    }
  }, UPTIME_CHECK_INTERVAL);
  uptimeTimer.unref();

  const billingTimer = setInterval(async () => {
    try {
      await reconcileCompletedPaymentBillingRecords();
      await reconcileCompletedPerformancePayments();
      await reconcileCompletedRepairPayments();
      await runRepairReviewReminders();
      await reconcilePayableBuildInvoices();
      await runInvoiceReminders();
    } catch (error) {
      logger.error('Scheduled billing reminders failed', { error: error.message });
    }
  }, BILLING_REMINDER_INTERVAL);
  billingTimer.unref();
  
  setInterval(async () => {
    logger.info('Starting scheduled daily operational tasks');
    
    try {
      // 1. Subscription & Suspension Audit
      const suspensionResults = await runSuspensionAutomation();
      logger.info('Suspension audit completed', suspensionResults);

      // 2. Maintenance Audit
      await runMaintenanceAudit();

      // Keep detailed uptime history bounded while preserving scan reports.
      await cleanupAvailabilityHistory();

    } catch (error) {
      logger.error('Scheduled operational tasks failed', { error: error.message });
    }
  }, TWENTY_FOUR_HOURS);
};

exports.runPerformanceHistoryRetention = cleanupAvailabilityHistory;

async function cleanupAvailabilityHistory() {
  try {
    const { prisma } = require('../config/db');
    const cutoff = new Date(Date.now() - AVAILABILITY_HISTORY_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    const batchSize = 5000;
    let totalDeleted = 0;

    while (true) {
      const expiredRows = await prisma.siteAvailabilityCheck.findMany({
        where: { checkedAt: { lt: cutoff } },
        orderBy: { checkedAt: 'asc' },
        take: batchSize,
        select: { id: true }
      });
      if (!expiredRows.length) break;

      const deleted = await prisma.siteAvailabilityCheck.deleteMany({
        where: { id: { in: expiredRows.map(row => row.id) }, checkedAt: { lt: cutoff } }
      });
      totalDeleted += deleted.count;
      if (expiredRows.length < batchSize) break;
    }

    logger.info('Performance availability history retention pass complete', {
      retentionDays: AVAILABILITY_HISTORY_RETENTION_DAYS,
      deletedChecks: totalDeleted
    });
  } catch (error) {
    logger.warn('Performance availability history retention pass failed', {
      errorCode: error.code || 'AVAILABILITY_RETENTION_ERROR'
    });
  }
}

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

