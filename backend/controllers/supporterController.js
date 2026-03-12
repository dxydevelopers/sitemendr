const supporterService = require('../services/supporterService');
const logger = require('../config/logger');

/**
 * List all active supporter tiers
 */
exports.getTiers = async (req, res) => {
  try {
    logger.info('GET_TIERS_REQUEST_RECEIVED');
    const tiers = await supporterService.getTiers();
    logger.info('GET_TIERS_SUCCESS', { count: tiers?.length });
    res.json({
      success: true,
      tiers
    });
  } catch (error) {
    logger.error('Error in getTiers controller', { 
      message: error.message,
      stack: error.stack,
      modelExists: !!require('../config/db').prisma.supporterTier
    });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supporter tiers',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get current user's supporter status
 */
exports.getMySupporter = async (req, res) => {
  try {
    const userId = req.user.id;
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
  // For now, redirecting to payment controller logic
  res.status(501).json({
    success: false,
    message: 'Subscription initialization via this endpoint is not yet implemented. Use payment endpoints with serviceType=supporter'
  });
};
