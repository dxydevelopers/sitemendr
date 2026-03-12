const { prisma } = require('../config/db');
const logger = require('../config/logger');
const { sendEmail } = require('../config/email');

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

  // Send Welcome Email
  await this.sendSupporterWelcomeEmail(supporter.user, tier, discountCode);

  return supporter;
};

/**
 * Send welcome email to new supporter
 */
exports.sendSupporterWelcomeEmail = async (user, tier, discountCode) => {
  try {
    await sendEmail({
      to: user.email,
      subject: `🌟 Welcome to the ${tier.name} Tier!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">Thank you for your support, ${user.name}!</h2>
          <p>We're thrilled to have you as part of our <strong>${tier.name}</strong> tier. Your contribution helps us keep Sitemendr growing and improving.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Your Exclusive Benefits:</h3>
            <ul>
              <li><strong>${tier.discountPercent}% Discount</strong> on all future orders</li>
              <li>Exclusive Supporter Badge on your profile</li>
              <li>Access to supporter-only community events</li>
            </ul>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p>Use your exclusive discount code at checkout:</p>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #007bff; border: 2px dashed #007bff; padding: 10px; display: inline-block;">
              ${discountCode.code}
            </div>
          </div>

          <p>Check out your <a href="${process.env.FRONTEND_URL}/supporter/dashboard">Supporter Dashboard</a> to see all your perks and upcoming events.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            &copy; ${new Date().getFullYear()} Sitemendr. All rights reserved.
          </p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send supporter welcome email', { userId: user.id, error: error.message });
  }
};

/**
 * Send cancellation email
 */
exports.sendCancellationEmail = async (user, tier) => {
  try {
    await sendEmail({
      to: user.email,
      subject: `👋 We're sorry to see you go, ${user.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #333;">Subscription Cancelled</h2>
          <p>Hi ${user.name}, we've received your request to cancel your <strong>${tier.name}</strong> support subscription.</p>
          <p>Your benefits will remain active until the end of your current billing period.</p>
          
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0;">We'd love to have you back! You can reactivate your support at any time to regain full access to your perks and discounts.</p>
          </div>

          <p>If this was a mistake, or if you have any feedback on how we can improve, please just reply to this email.</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999; text-align: center;">
            &copy; ${new Date().getFullYear()} Sitemendr. All rights reserved.
          </p>
        </div>
      `
    });
  } catch (error) {
    logger.error('Failed to send cancellation email', { userId: user.id, error: error.message });
  }
};
