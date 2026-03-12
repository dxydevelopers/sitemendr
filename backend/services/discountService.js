const { prisma } = require('../config/db');
const logger = require('../config/logger');

/**
 * Validate a discount code
 * @param {string} code - The discount code to validate
 * @param {string} userId - The user trying to use the code
 * @param {number} totalAmount - Current order total
 */
exports.validateDiscountCode = async (code, userId, totalAmount) => {
  try {
    const discountCode = await prisma.discountCode.findUnique({
      where: { code },
      include: {
        supporter: true,
        tier: true
      }
    });

    if (!discountCode || !discountCode.isActive) {
      return { valid: false, message: 'Invalid or inactive discount code' };
    }

    const now = new Date();
    if (discountCode.validFrom > now) {
      return { valid: false, message: 'This discount code is not yet active' };
    }

    if (discountCode.expiresAt && discountCode.expiresAt < now) {
      return { valid: false, message: 'This discount code has expired' };
    }

    if (discountCode.maxUses !== null && discountCode.currentUses >= discountCode.maxUses) {
      return { valid: false, message: 'This discount code has reached its usage limit' };
    }

    if (discountCode.minPurchaseAmount && totalAmount < discountCode.minPurchaseAmount) {
      return { 
        valid: false, 
        message: `Minimum purchase amount of ${discountCode.minPurchaseAmount} required for this discount` 
      };
    }

    // If it's a supporter-specific code, verify user owns it
    if (discountCode.supporterId && discountCode.supporter.userId !== userId) {
      return { valid: false, message: 'This discount code is not assigned to your account' };
    }

    return { valid: true, discountCode };
  } catch (error) {
    logger.error('Error validating discount code', { code, error: error.message });
    return { valid: false, message: 'Error validating discount code' };
  }
};

/**
 * Calculate discount amount
 */
exports.calculateDiscount = (discountCode, totalAmount) => {
  if (discountCode.discountType === 'percentage') {
    return (totalAmount * discountCode.discountValue) / 100;
  } else if (discountCode.discountType === 'fixed') {
    return Math.min(discountCode.discountValue, totalAmount);
  }
  return 0;
};

/**
 * Increment discount code usage
 */
exports.incrementUsage = async (id) => {
  return await prisma.discountCode.update({
    where: { id },
    data: { currentUses: { increment: 1 } }
  });
};
