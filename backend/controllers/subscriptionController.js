const { prisma } = require('../config/db');
const { getEnforcementConfig } = require('../middleware/paymentEnforcement');
const { sendEmail } = require('../config/email');
const { processSuccessfulPayment } = require('../services/paymentService');
const { deployTemplate } = require('../services/deploymentService');
const logger = require('../config/logger');

// Get user's subscription
exports.getUserSubscription = async (req, res) => {
  try {
    // Mitigate schema mismatch by selecting known columns
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: { not: 'cancelled' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        siteName: true,
        customName: true,
        price: true,
        planType: true,
        domain: true,
        totalPaid: true,
        credit: true,
        lastPaymentDate: true,
        expiresAt: true,
        status: true,
        tier: true,
        gracePeriodDays: true,
        suspendedAt: true,
        reactivationAttempts: true,
        createdAt: true,
        updatedAt: true,
        suspended: true,
        customDomains: true
      }
    });

    if (!subscription) {
      return res.json({
        success: true,
        data: null,
        message: 'No active subscription found'
      });
    }

    // Calculate payment status
    const now = new Date();
    const isExpired = subscription.expiresAt && new Date(subscription.expiresAt) < now;
    const daysOverdue = isExpired ?
      Math.floor((now - new Date(subscription.expiresAt)) / (1000 * 60 * 60 * 24)) : 0;

    const enforcementConfig = await getEnforcementConfig(subscription.tier);

    res.json({
      success: true,
      data: {
        ...subscription,
        paymentStatus: {
          active: !isExpired || daysOverdue <= enforcementConfig.maxGracePeriod,
          daysOverdue,
          isExpired,
          nextBillingDate: subscription.expiresAt,
          amountDue: subscription.price || 29
        }
      }
    });
  } catch (error) {
    logger.error('GET_USER_SUBSCRIPTION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscription'
    });
  }
};

// Create or update subscription
exports.createOrUpdateSubscription = async (req, res) => {
  try {
    const {
      siteName,
      customName,
      price,
      planType = 'monthly',
      domain,
      tier = 'ai_foundation'
    } = req.body;

    // Check if subscription already exists
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: { not: 'cancelled' }
      },
      select: { id: true }
    });

    const subscriptionData = {
      siteName,
      customName,
      price,
      planType,
      domain,
      tier,
    };

    const select = {
      id: true,
      userId: true,
      siteName: true,
      customName: true,
      price: true,
      planType: true,
      domain: true,
      status: true,
      tier: true,
      createdAt: true,
      updatedAt: true,
      suspended: true
    };

    if (subscription) {
      // Update existing subscription
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: subscriptionData,
        select
      });
    } else {
      // Create new subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: req.user.userId,
          ...subscriptionData,
          status: 'active',
          suspended: false
        },
        select
      });
    }

    res.json({
      success: true,
      data: subscription,
      message: subscription ? 'Subscription updated' : 'Subscription created'
    });
  } catch (error) {
    logger.error('CREATE_UPDATE_SUBSCRIPTION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create/update subscription'
    });
  }
};

// Process successful payment and extend subscription
exports.processPaymentSuccess = async (req, res) => {
  try {
    const { paymentId } = req.body;

    // Trigger post-payment processing via service
    await processSuccessfulPayment(paymentId);

    // Get updated subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.userId,
        status: { not: 'cancelled' }
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        status: true,
        expiresAt: true,
        template: true
      }
    });

    res.json({
      success: true,
      data: subscription,
      message: 'Payment processed and subscription updated'
    });
  } catch (error) {
    logger.error('PROCESS_PAYMENT_SUCCESS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment success'
    });
  }
};

// Suspend subscription (admin only)
exports.suspendSubscription = async (req, res) => {
  try {
    const { subscriptionId, reason } = req.body;

    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'suspended',
        suspendedAt: new Date(),
        suspended: true,
      },
      select: {
        id: true,
        siteName: true,
        customName: true,
        status: true,
        user: true
      }
    });

    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Send suspension notification email
    if (updatedSubscription.user) {
      try {
        await sendEmail({
          to: updatedSubscription.user.email,
          subject: '🚨 Website Suspended: Action Required',
          html: `
            <h2>Hello ${updatedSubscription.user.name},</h2>
            <p>Your website subscription for <strong>${updatedSubscription.siteName || updatedSubscription.customName || 'your site'}</strong> has been suspended.</p>
            <p>Reason: ${reason || 'Payment overdue'}</p>
            <p>To reactivate your site, please log in to your dashboard and update your payment method.</p>
            <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#dc3545;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Go to Dashboard</a>
          `
        });
      } catch (emailError) {
        logger.error('SUSPENSION_EMAIL_ERROR:', emailError);
      }
    }

    res.json({
      success: true,
      data: updatedSubscription,
      message: 'Subscription suspended'
    });
  } catch (error) {
    logger.error('SUSPEND_SUBSCRIPTION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend subscription'
    });
  }
};

// Reactivate subscription
exports.reactivateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        expiresAt: true,
        price: true
      }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if payment is needed
    const now = new Date();
    if (subscription.expiresAt && new Date(subscription.expiresAt) > now) {
      // Already active
      return res.json({
        success: true,
        data: subscription,
        message: 'Subscription is already active'
      });
    }

    // For reactivation, we need payment first
    res.json({
      success: false,
      message: 'Payment required for reactivation',
      data: {
        subscriptionId: subscription.id,
        amountDue: subscription.price,
        requiresPayment: true
      }
    });
  } catch (error) {
    logger.error('REACTIVATE_SUBSCRIPTION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reactivate subscription'
    });
  }
};

// Get all subscriptions (admin only)
exports.getAllSubscriptions = async (req, res) => {
  try {
    const { status, tier, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status) where.status = status;
    if (tier) where.tier = tier;

    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        select: {
          id: true,
          userId: true,
          siteName: true,
          customName: true,
          price: true,
          planType: true,
          domain: true,
          status: true,
          tier: true,
          createdAt: true,
          user: {
            select: { id: true, name: true, email: true }
          },
          customDomains: true
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.subscription.count({ where })
    ]);

    res.json({
      success: true,
      data: subscriptions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('GET_ALL_SUBSCRIPTIONS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve subscriptions'
    });
  }
};

/**
 * Deploy subscription - Finalizes site and sets up infrastructure
 */
exports.deploySubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    const userId = req.user.userId;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        userId: true,
        user: true,
        template: true
      }
    });

    if (!subscription || subscription.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    // Trigger deployment via service
    const deployment = await deployTemplate(subscriptionId);

    if (!deployment.success) {
      return res.status(500).json({ 
        success: false, 
        message: deployment.message || 'Failed to deploy website' 
      });
    }

    res.json({
      success: true,
      message: 'Website deployed successfully to production infrastructure',
      data: {
        url: deployment.url,
        deployedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('DEPLOY_SUBSCRIPTION_ERROR:', error);
    res.status(500).json({ success: false, message: 'Failed to deploy website' });
  }
};

/**
 * Manual trigger for template generation
 */
exports.generateSubscriptionTemplate = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      select: {
        id: true,
        userId: true,
        user: { select: { email: true } }
      }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Find assessment - assuming leadEmail matches user.email
    const assessment = await prisma.assessment.findFirst({
      where: {
        convertedToLead: true,
        lead: {
          email: subscription.user.email
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!assessment || !assessment.responses || !assessment.results) {
      return res.status(400).json({ 
        success: false, 
        message: 'No assessment data found for this user. Please complete the assessment first.' 
      });
    }

    const { generateTemplateAI } = require('./assessment'); 
    const template = await generateTemplateAI(subscription.id, assessment.responses, assessment.results);

    if (!template) {
      return res.status(500).json({ success: false, message: 'Failed to generate template' });
    }

    res.json({
      success: true,
      data: template,
      message: 'Template generated successfully'
    });
  } catch (error) {
    logger.error('MANUAL_TEMPLATE_GENERATION_ERROR:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
