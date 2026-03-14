const supporterService = require('../services/supporterService');
const logger = require('../config/logger');
const paymentController = require('./paymentController');

/**
 * List all active supporter tiers
 */
exports.getTiers = async (req, res) => {
  try {
    logger.info('GET_TIERS_REQUEST_RECEIVED');
    const { prisma } = require('../config/db');
    
    // Check if the model is available in the Prisma client
    if (!prisma.supporterTier) {
      logger.error('PRISMA_MODEL_MISSING', { model: 'supporterTier' });
      return res.status(500).json({
        success: false,
        message: 'Supporter features are not initialized in the database client. Please run "npx prisma generate" on the server.',
        error: 'Prisma model "supporterTier" is missing'
      });
    }
    
    // Explicit debug checks
    const modelExists = !!prisma.supporterTier;
    let rowCount = 0;
    if (modelExists) {
      rowCount = await prisma.supporterTier.count();
    }

    const tiers = await supporterService.getTiers();
    logger.info('GET_TIERS_SUCCESS', { count: tiers?.length });
    res.json({
      success: true,
      tiers,
      debug: {
        modelExists,
        rowCount,
        nodeEnv: process.env.NODE_ENV
      }
    });
  } catch (error) {
    logger.error('Error in getTiers controller', { 
      message: error.message,
      stack: error.stack,
      modelExists: !!require('../config/db').prisma.supporterTier
    });
    console.error('DEBUG_GET_TIERS_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supporter tiers',
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Get current user's supporter status
 */
exports.getMySupporter = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const supporter = await supporterService.getSupporterByUserId(userId);
    
    if (!supporter) {
      return res.json({
        success: true,
        isSupporter: false,
        supporter: null
      });
    }

    res.json({
      success: true,
      isSupporter: true,
      supporter
    });
  } catch (error) {
    logger.error('Error in getMySupporter controller', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supporter status'
    });
  }
};

/**
 * Initialize a supporter subscription payment (handled by payment controller typically)
 * But we provide a specific endpoint if needed.
 */
exports.initializeSubscription = async (req, res) => {
  // Logic to initialize Paystack subscription would go here
  // Redirecting to payment controller logic
  req.body.serviceType = 'supporter';
  return paymentController.initializePayment(req, res);
};
