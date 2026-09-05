const { prisma } = require('../config/db');
const { getEnforcementConfig } = require('../middleware/paymentEnforcement');
const logger = require('../config/logger');

// Automated suspension script - run daily via cron job
const runSuspensionAutomation = async () => {
  logger.info('Running subscription suspension automation');

  try {
    const now = new Date();

    // Find subscriptions that need to be suspended
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'active',
        expiresAt: {
          lt: now
        }
      },
      select: {
        id: true,
        tier: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    let suspendedCount = 0;
    let notifiedCount = 0;

    for (const subscription of expiredSubscriptions) {
      const daysOverdue = Math.floor((now - subscription.expiresAt) / (1000 * 60 * 60 * 24));
      const enforcementConfig = await getEnforcementConfig(subscription.tier);

      if (daysOverdue > enforcementConfig.maxGracePeriod) {
        // Suspend the subscription
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            status: 'suspended',
            suspendedAt: now
          },
          select: { id: true }
        });

        // NOTE: suspension email removed as part of notification cleanup.
        // If this needs an email again later, wire it via notify() and the registry.

        logger.info('Suspended subscription', {
          errorCode: 'AUTOMATION_SUBSCRIPTION_SUSPENDED',
          user: subscription.user.email,
          daysOverdue
        });

        suspendedCount++;
      } else if (daysOverdue >= enforcementConfig.overlayThreshold) {
        // NOTE: payment reminder email removed as part of notification cleanup.
        // If this needs an email again later, wire it via notify() and the registry.

        logger.info('Payment reminder threshold reached (email disabled)', {
          errorCode: 'AUTOMATION_REMINDER_SENT',
          user: subscription.user.email,
          daysOverdue
        });
        notifiedCount++;
      }
    }

    logger.info('Suspension automation completed', {
      errorCode: 'AUTOMATION_COMPLETED',
      suspended: suspendedCount,
      notified: notifiedCount,
      processed: expiredSubscriptions.length
    });

    return {
      suspended: suspendedCount,
      notified: notifiedCount,
      processed: expiredSubscriptions.length
    };

  } catch (error) {
    logger.error('Suspension automation error', {
      errorCode: 'AUTOMATION_CRITICAL_ERROR',
      error: error.message
    });
    throw error;
  }
};

// Manual suspension for specific subscription
const suspendSubscription = async (subscriptionId, reason = 'Payment overdue') => {
  try {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'suspended',
        suspendedAt: new Date()
      },
      select: { id: true }
    });

    // NOTE: manual suspension email removed as part of notification cleanup.
    // If this needs an email again later, wire it via notify() and the registry.

    logger.info('Manually suspended subscription', {
      errorCode: 'MANUAL_SUBSCRIPTION_SUSPENDED',
      subscriptionId,
      user: subscription.user.email
    });

    return {
      success: true,
      subscriptionId,
      userEmail: subscription.user.email
    };

  } catch (error) {
    logger.error('Manual suspension error', {
      errorCode: 'MANUAL_SUSPENSION_CRITICAL_ERROR',
      error: error.message
    });
    throw error;
  }
};

// Reactivation check - run after successful payment
const checkForReactivation = async (userId) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: 'suspended'
      },
      select: {
        id: true,
        planType: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      return { needsReactivation: false };
    }

    // Check if there are recent successful payments
    const recentPayment = await prisma.payment.findFirst({
      where: {
        userId,
        status: 'completed',
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (recentPayment) {
      // Reactivate subscription
      const newExpiryDate = new Date();
      if (subscription.planType === 'monthly') {
        newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
      } else {
        newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
      }

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          expiresAt: newExpiryDate,
          suspendedAt: null,
          reactivationAttempts: {
            increment: 1
          }
        },
        select: { id: true }
      });

      // NOTE: reactivation confirmation email removed as part of notification cleanup.
      // If this needs an email again later, wire it via notify() and the registry.

      logger.info('Reactivated subscription', {
        errorCode: 'SUBSCRIPTION_REACTIVATED',
        userId
      });

      return {
        needsReactivation: true,
        reactivated: true,
        subscriptionId: subscription.id
      };
    }

    return {
      needsReactivation: true,
      reactivated: false,
      subscriptionId: subscription.id
    };

  } catch (error) {
    logger.error('Reactivation check error', {
      errorCode: 'REACTIVATION_CHECK_ERROR',
      error: error.message
    });
    throw error;
  }
};

module.exports = {
  runSuspensionAutomation,
  suspendSubscription,
  checkForReactivation
};