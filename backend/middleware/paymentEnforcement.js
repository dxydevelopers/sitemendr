const { prisma } = require('../config/db');
const logger = require('../config/logger');

// Payment enforcement middleware
const checkPaymentStatus = async (req, res, next) => {
  try {
    // Get client from domain or user ID
    const clientId = req.params.clientId || req.query.clientId || req.user?.userId;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: 'Client ID required for payment enforcement'
      });
    }

    // Get subscription status - explicitly select columns to avoid missing column errors
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: clientId,
        status: { not: 'cancelled' }
      },
      select: {
        id: true,
        userId: true,
        status: true,
        tier: true,
        price: true,
        expiresAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      // No subscription found - allow access for new clients or redirect to signup
      return next();
    }

    const now = new Date();
    const isExpired = subscription.expiresAt && subscription.expiresAt < now;
    const daysOverdue = isExpired ?
      Math.floor((now - subscription.expiresAt) / (1000 * 60 * 60 * 24)) : 0;

    // Determine enforcement level based on tier
    const enforcementConfig = await getEnforcementConfig(subscription.tier);

    if (subscription.status === 'suspended' || daysOverdue > enforcementConfig.maxGracePeriod) {
      // Full payment wall
      return res.status(402).json({
        success: false,
        message: 'Website temporarily unavailable due to outstanding payment',
        data: {
          amountDue: subscription.price || 29,
          daysOverdue,
          reactivationLink: generatePaymentLink(clientId),
          contactSupport: true
        }
      });
    }

    if (isExpired && daysOverdue >= enforcementConfig.overlayThreshold) {
      // Payment reminder overlay
      res.locals.paymentReminder = {
        daysLeft: enforcementConfig.maxGracePeriod - daysOverdue,
        amountDue: subscription.price || 29,
        updatePaymentLink: generatePaymentLink(clientId)
      };
    }

    // Attach subscription info to request
    req.subscription = subscription;
    req.paymentStatus = {
      active: !isExpired || daysOverdue <= enforcementConfig.maxGracePeriod,
      daysOverdue,
      tier: subscription.tier,
      expiresAt: subscription.expiresAt
    };

    next();
  } catch (error) {
    logger.error('Payment enforcement middleware error', {
      errorCode: 'PAYMENT_ENFORCEMENT_MIDDLEWARE_ERROR',
      error: error.message
    });
    // On error, allow access to prevent blocking legitimate users
    next();
  }
};

// Get enforcement configuration based on tier
const getEnforcementConfig = async (tier) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'payment_enforcement' }
    });

    const configs = setting ? setting.value : {
      ai_foundation: {
        overlayThreshold: 7,
        maxGracePeriod: 14,
        reminderFrequency: 'daily'
      },
      pro_enhancement: {
        overlayThreshold: 14,
        maxGracePeriod: 30,
        reminderFrequency: 'weekly'
      },
      enterprise: {
        overlayThreshold: 30,
        maxGracePeriod: 60,
        reminderFrequency: 'monthly'
      },
      self_hosted: {
        overlayThreshold: 365,
        maxGracePeriod: 730,
        reminderFrequency: 'yearly'
      },
      maintenance: {
        overlayThreshold: 3,
        maxGracePeriod: 7,
        reminderFrequency: 'daily'
      }
    };

    return configs[tier] || configs.ai_foundation;
  } catch (error) {
    logger.error('Error in getEnforcementConfig', {
      errorCode: 'GET_ENFORCEMENT_CONFIG_ERROR',
      error: error.message
    });
    return {
      overlayThreshold: 7,
      maxGracePeriod: 14,
      reminderFrequency: 'daily'
    };
  }
};

// Generate payment link for reactivation
const generatePaymentLink = (clientId) => {
  return `${process.env.FRONTEND_URL}/payment/reactivate?client=${clientId}`;
};

// Middleware for API routes (returns JSON instead of rendering pages)
const enforcePaymentForAPI = (req, res, next) => {
  if (req.paymentStatus && !req.paymentStatus.active) {
    return res.status(402).json({
      success: false,
      message: 'Payment required to access this service',
      data: {
        subscriptionStatus: req.paymentStatus,
        paymentRequired: true
      }
    });
  }
  next();
};

module.exports = {
  checkPaymentStatus,
  enforcePaymentForAPI,
  getEnforcementConfig,
  generatePaymentLink
};
