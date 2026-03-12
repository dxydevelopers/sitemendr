const supporterService = require('../services/supporterService');
const logger = require('../config/logger');

/**
 * List all active supporter tiers
 */
exports.getTiers = async (req, res) => {
  try {
    const tiers = await supporterService.getTiers();
    res.json({
      success: true,
      tiers
    });
  } catch (error) {
    logger.error('Error in getTiers controller', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch supporter tiers'
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
