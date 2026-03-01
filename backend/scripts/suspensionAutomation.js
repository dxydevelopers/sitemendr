const { prisma } = require('../config/db');
const { getEnforcementConfig } = require('../middleware/paymentEnforcement');
const { sendEmail } = require('../config/email');
const logger = require('../config/logger');

// Email template helpers
const sendSuspensionEmail = async (email, name, daysOverdue) => {
  await sendEmail({
    to: email,
    subject: '🚨 Website Suspended: Action Required',
    html: `
      <h2>Hello ${name},</h2>
      <p>Your website has been temporarily suspended because your hosting payment is ${daysOverdue} days overdue.</p>
      <p>To reactivate your site immediately, please click the link below to update your payment method:</p>
      <a href="${process.env.FRONTEND_URL}/payment/reactivate" style="background:#dc3545;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Reactivate My Website</a>
      <p>Once payment is processed, your site will be live again instantly.</p>
      <p>If you have any questions, please contact our support team.</p>
    `
  });
};

const sendPaymentReminderEmail = async (email, name, daysOverdue, maxGrace) => {
  const daysRemaining = maxGrace - daysOverdue;
  await sendEmail({
    to: email,
    subject: `🔔 Payment Reminder: ${daysRemaining} Days Left`,
    html: `
      <h2>Hello ${name},</h2>
      <p>This is a reminder that your website hosting payment is overdue by ${daysOverdue} days.</p>
      <p><strong>Your site will be suspended in ${daysRemaining} days</strong> if payment is not received.</p>
      <p>Please update your payment information to avoid any service interruption:</p>
      <a href="${process.env.FRONTEND_URL}/payment/billing" style="background:#ffc107;color:black;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Update Payment Information</a>
      <p>Thank you for your business!</p>
    `
  });
};

const sendReactivationEmail = async (email, name) => {
  await sendEmail({
    to: email,
    subject: '✅ Website Reactivated!',
    html: `
      <h2>Great news, ${name}!</h2>
      <p>Your payment was successful and your website has been fully reactivated.</p>
      <p>You can now access your site as usual. Thank you for your prompt payment!</p>
      <a href="${process.env.FRONTEND_URL}" style="background:#28a745;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Visit My Website</a>
    `
  });
};

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
      const enforcementConfig = getEnforcementConfig(subscription.tier);

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

        // Send suspension email notification
        try {
          await sendSuspensionEmail(subscription.user.email, subscription.user.name, daysOverdue);
        } catch (e) {
          logger.error('Failed to send suspension email', {
            errorCode: 'AUTOMATION_SUSPENSION_EMAIL_ERROR',
            user: subscription.user.email,
            error: e.message
          });
        }
        
        logger.info('Suspended subscription', {
          errorCode: 'AUTOMATION_SUBSCRIPTION_SUSPENDED',
          user: subscription.user.email,
          daysOverdue
        });

        suspendedCount++;
      } else if (daysOverdue >= enforcementConfig.overlayThreshold) {
        // Send payment reminder
        try {
          await sendPaymentReminderEmail(
            subscription.user.email, 
            subscription.user.name, 
            daysOverdue, 
            enforcementConfig.maxGracePeriod
          );
        } catch (e) {
          logger.error('Failed to send reminder email', {
            errorCode: 'AUTOMATION_REMINDER_EMAIL_ERROR',
            user: subscription.user.email,
            error: e.message
          });
        }
        
        logger.info('Payment reminder sent', {
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

    // Send suspension notification email
    try {
      await sendSuspensionEmail(subscription.user.email, subscription.user.name, 'multiple');
    } catch (e) {
      logger.error('Failed to send manual suspension email', {
        errorCode: 'MANUAL_SUSPENSION_EMAIL_ERROR',
        user: subscription.user.email,
        error: e.message
      });
    }

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

      // Send reactivation confirmation email
      try {
        await sendReactivationEmail(subscription.user.email, subscription.user.name);
      } catch (e) {
        logger.error('Failed to send reactivation email', {
          errorCode: 'REACTIVATION_EMAIL_ERROR',
          user: subscription.user.email,
          error: e.message
        });
      }

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