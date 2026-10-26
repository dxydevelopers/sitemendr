const { prisma } = require('../config/db');
const crypto = require('node:crypto');
const logger = require('../config/logger');
const { checkPublicSiteAvailability, saveSiteAvailabilityCheck } = require('../services/publicSiteProbe');
const { isBuildManagementUnlocked } = require('../services/siteManagement');
const { notifyAdmins, notifyUser } = require('../services/socketService');
let monitoringInProgress = false;

/**
 * Record the latest public-site health result without replacing PageSpeed data.
 */
async function monitorUptime() {
  if (monitoringInProgress) {
    logger.info('Skipping uptime cycle because the previous cycle is still running');
    return;
  }
  monitoringInProgress = true;
  const leaseOwner = `${process.pid}:${crypto.randomUUID()}`;
  let leaseAcquired = false;
  logger.info('Starting uptime monitoring worker');

  try {
    const leaseRows = await prisma.$queryRaw`
      INSERT INTO "SiteAvailabilityMonitorLease" ("id", "ownerId", "leaseUntil", "updatedAt")
      VALUES ('uptime-monitor', ${leaseOwner}, NOW() + INTERVAL '3 minutes', NOW())
      ON CONFLICT ("id") DO UPDATE
      SET "ownerId" = EXCLUDED."ownerId", "leaseUntil" = EXCLUDED."leaseUntil", "updatedAt" = NOW()
      WHERE "SiteAvailabilityMonitorLease"."leaseUntil" < NOW()
      RETURNING "id"
    `;
    if (!leaseRows.length) {
      logger.info('Skipping uptime cycle because another backend instance owns the monitoring lease');
      return;
    }
    leaseAcquired = true;

    const subscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        OR: [
          { domain: { not: null } },
          { customDomains: { some: {} } },
          { projectRequests: { some: { serviceType: 'build', status: 'completed', launchUrl: { not: null } } } }
        ]
      },
      select: {
        id: true,
        userId: true,
        siteName: true,
        customName: true,
        domain: true,
        performanceData: true,
        customDomains: {
          where: { status: { in: ['verified', 'active'] } },
          select: { domain: true },
          orderBy: { createdAt: 'asc' }
        },
        projectRequests: {
          where: { serviceType: 'build' },
          select: {
            status: true,
            completionAcknowledgedAt: true,
            handoffIssuesReportedAt: true,
            finalPaymentConfirmedAt: true,
            paymentConfirmedAt: true,
            totalAgreedAmount: true,
            quotedAmount: true,
            depositAmount: true,
            launchUrl: true
          },
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    logger.info('Monitoring active client sites', { count: subscriptions.length });

    for (const subscription of subscriptions) {
      const leaseRenewal = await prisma.$queryRaw`
        UPDATE "SiteAvailabilityMonitorLease"
        SET "leaseUntil" = NOW() + INTERVAL '3 minutes', "updatedAt" = NOW()
        WHERE "id" = 'uptime-monitor' AND "ownerId" = ${leaseOwner}
        RETURNING "id"
      `;
      if (!leaseRenewal.length) {
        leaseAcquired = false;
        logger.warn('Stopping uptime cycle because its shared monitoring lease was lost');
        break;
      }

      const linkedBuild = subscription.projectRequests[0];
      if (!isBuildManagementUnlocked(linkedBuild)) {
        logger.info('Skipping availability check until site handoff and payment closeout', {
          subscriptionId: subscription.id
        });
        continue;
      }
      const target = subscription.domain
        || subscription.customDomains[0]?.domain
        || (linkedBuild?.status === 'completed' ? linkedBuild.launchUrl : null);
      if (!target) continue;

      let result;
      try {
        result = await checkPublicSiteAvailability(target);
      } catch (error) {
        logger.warn('Uptime probe could not reach a client site', {
          subscriptionId: subscription.id,
          errorCode: error.code || 'UPTIME_PROBE_ERROR'
        });
        result = {
          status: 'DOWN',
          timestamp: new Date().toISOString(),
          error: error.code === 'UNSAFE_SITE_ADDRESS' || error.code === 'UNSAFE_SITE_URL'
            ? 'The configured site address is not publicly reachable.'
            : 'The site did not respond.'
        };
      }

      try {
        await saveSiteAvailabilityCheck(prisma, subscription.id, result, 'scheduled');
        const previousStatus = subscription.performanceData?.status;
        if (result.status !== previousStatus && (result.status === 'DOWN' || previousStatus === 'DOWN')) {
          const alert = {
            subscriptionId: subscription.id,
            siteName: subscription.siteName || subscription.customName || target,
            domain: target,
            previousStatus: previousStatus || null,
            status: result.status,
            statusCode: result.statusCode || null,
            checkedAt: result.timestamp
          };
          notifyAdmins('site_availability_alert', alert);
          notifyUser(subscription.userId, 'site_availability_alert', alert);
        }
      } catch (error) {
        logger.warn('Could not save uptime result for a client site', {
          subscriptionId: subscription.id,
          errorCode: error.code || 'UPTIME_RESULT_SAVE_ERROR'
        });
      }
    }

    logger.info('Uptime monitoring cycle complete', { count: subscriptions.length });
  } catch (error) {
    logger.error('Uptime worker failed', {
      errorCode: 'UPTIME_WORKER_ERROR',
      error: error.message
    });
  } finally {
    if (leaseAcquired) {
      await prisma.$executeRaw`
        UPDATE "SiteAvailabilityMonitorLease"
        SET "leaseUntil" = NOW(), "updatedAt" = NOW()
        WHERE "id" = 'uptime-monitor' AND "ownerId" = ${leaseOwner}
      `.catch(error => logger.warn('Could not release uptime monitoring lease', { errorCode: error.code || 'UPTIME_LEASE_RELEASE_ERROR' }));
    }
    monitoringInProgress = false;
  }
}

if (require.main === module) {
  monitorUptime()
    .then(() => process.exit(0))
    .catch(error => {
      logger.error('Uptime worker startup failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = { monitorUptime };
