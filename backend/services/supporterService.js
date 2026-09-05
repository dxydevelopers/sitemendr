const { prisma } = require('../config/db');
const logger = require('../config/logger');

/**
 * Get all active supporter tiers
 */
exports.getTiers = async () => {
  return await prisma.supporterTier.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' }
  });
};

/**
 * Get supporter status for a user
 */
exports.getSupporterByUserId = async (userId) => {
  return await prisma.supporter.findFirst({
    where: { userId },
    include: {
      tier: true,
      discountCodes: {
        where: { isActive: true }
      }
    }
  });
};

/**
 * Handle successful supporter payment/subscription
 */
exports.handleSupporterActivation = async (payment) => {
  const { userId, metadata, amount, currency, reference } = payment;
  const tierId = metadata?.tierId;
  
  if (!tierId) {
    logger.error('Tier ID missing in supporter payment metadata', { paymentId: payment.id });
    return;
  }

  const tier = await prisma.supporterTier.findUnique({
    where: { id: tierId }
  });

  if (!tier) {
    logger.error('Supporter tier not found', { tierId, paymentId: payment.id });
    return;
  }

  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setMonth(expiresAt.getMonth() + 1); // Default to monthly

  // Create or update supporter record
  const supporter = await prisma.supporter.upsert({
    where: { reference },
    create: {
      userId,
      tierId,
      status: 'active',
      reference,
      monthlyAmount: amount / 100,
      currency,
      currentPeriodStart: now,
      currentPeriodEnd: expiresAt,
      lastPaymentDate: now
    },
    update: {
      status: 'active',
      tierId,
      monthlyAmount: amount / 100,
      currentPeriodEnd: expiresAt,
      lastPaymentDate: now
    },
    include: { user: true }
  });

  // Generate a unique discount code for the supporter if they don't have an active one for this year
  const currentYear = new Date().getFullYear();
  const codePrefix = `SUPPORTER-${currentYear}-`;
  
  const existingCode = await prisma.discountCode.findFirst({
    where: {
      supporterId: supporter.id,
      code: { startsWith: codePrefix },
      isActive: true
    }
  });

  let discountCode;
  if (!existingCode) {
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const code = `${codePrefix}${randomStr}`;
    
    discountCode = await prisma.discountCode.create({
      data: {
        code,
        supporterId: supporter.id,
        tierId: tier.id,
        discountType: 'percentage',
        discountValue: tier.discountPercent,
        isActive: true,
        validFrom: now,
        expiresAt: expiresAt
      }
    });
  } else {
    discountCode = existingCode;
  }

  // NOTE: welcome email removed as part of notification cleanup.
  // If this needs an email again later, wire it via notify() and the registry.

  return supporter;
};