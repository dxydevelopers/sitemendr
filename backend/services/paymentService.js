const { prisma } = require('../config/db');
const logger = require('../config/logger');
const { generateTemplateAI } = require('../controllers/assessment');
const { sendEmail } = require('../config/email');
const { deployTemplate } = require('./deploymentService');

/**
 * Process a successful payment and trigger necessary provisioning
 */
exports.processSuccessfulPayment = async (paymentId) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment || payment.status !== 'completed') {
      logger.error('Payment not found or not completed in processSuccessfulPayment', { paymentId });
      return;
    }

    const { userId, serviceType, metadata } = payment;

    // 1. Handle Subscription (Setup, Renewal or Reactivation)
    if (serviceType === 'subscription' || serviceType === 'setup' || serviceType === 'subscription_reactivation') {
      await handleSubscriptionActivation(payment);
    } 
    // 2. Handle Add-ons
    else if (serviceType === 'addon') {
      await handleAddonProvisioning(payment);
    }

    logger.info('Payment processing completed successfully', { paymentId, serviceType });
  } catch (error) {
    logger.error('Error in processSuccessfulPayment', { 
      paymentId, 
      error: error.message,
      stack: error.stack
    });
  }
};

/**
 * Handle subscription activation, extension, and AI template generation
 */
async function handleSubscriptionActivation(payment) {
  const { userId, metadata } = payment;
  const now = new Date();

  // Find existing subscription or create a new one
  let subscription = await prisma.subscription.findFirst({
    where: { 
      userId,
      status: { not: 'cancelled' }
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      expiresAt: true,
      tier: true,
      status: true,
      siteName: true,
      template: { select: { id: true } }
    }
  });

  const tier = metadata?.tier || 'ai_foundation';
  const planType = metadata?.planType || 'monthly';
  const siteName = metadata?.siteName || payment.description;

  if (subscription) {
    // Extend or Reactivate
    let newExpiryDate;
    if (subscription.expiresAt && subscription.expiresAt > now) {
      newExpiryDate = new Date(subscription.expiresAt);
    } else {
      newExpiryDate = new Date(now);
    }

    if (tier === 'self_hosted') {
      newExpiryDate = null; // No expiry for self-hosted
    } else if (planType === 'monthly') {
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1);
    } else {
      newExpiryDate.setFullYear(newExpiryDate.getFullYear() + 1);
    }

    subscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        expiresAt: newExpiryDate,
        lastPaymentDate: now,
        totalPaid: { increment: payment.amount / 100 },
        suspendedAt: null,
        reactivationAttempts: 0
      },
      select: {
        id: true,
        expiresAt: true,
        status: true,
        siteName: true,
        template: { select: { id: true } }
      }
    });
  } else {
    // Create new subscription
    let expiryDate = new Date(now);
    if (tier === 'self_hosted') {
      expiryDate = null;
    } else if (planType === 'monthly') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }

    subscription = await prisma.subscription.create({
      data: {
        userId,
        tier,
        planType,
        siteName,
        status: 'active',
        expiresAt: expiryDate,
        lastPaymentDate: now,
        totalPaid: payment.amount / 100,
        milestones: {
          create: [
            {
              title: 'Business Analysis',
              description: 'AI-driven analysis of business requirements and goals.',
              status: 'COMPLETED',
              progress: 100,
              order: 1
            },
            {
              title: 'AI Prototype Generation',
              description: 'Generating customized visual assets and technical structure.',
              status: 'IN_PROGRESS',
              progress: 25,
              order: 2
            },
            {
              title: 'Expert Review',
              description: 'Manual verification of AI-generated architecture by senior developers.',
              status: 'PENDING',
              progress: 0,
              order: 3
            },
            {
              title: 'Client Feedback Loop',
              description: 'Interactive session to refine design and functionality.',
              status: 'PENDING',
              progress: 0,
              order: 4
            },
            {
              title: 'Infrastructure Launch',
              description: 'Final deployment to global CDN with performance optimization.',
              status: 'PENDING',
              progress: 0,
              order: 5
            }
          ]
        }
      },
      select: {
        id: true,
        expiresAt: true,
        status: true,
        siteName: true,
        template: { select: { id: true } }
      }
    });
  }

  // 3. Trigger AI Template Generation if applicable
  if (tier === 'ai_foundation' && !subscription.template) {
    await triggerAITemplateGeneration(subscription, payment);
  }

  // 4. Send Confirmation Email
  await sendPaymentSuccessEmail(payment.user, subscription);
}

/**
 * Trigger AI Template generation based on assessment
 */
async function triggerAITemplateGeneration(subscription, payment) {
  try {
    const { metadata, userId } = payment;
    let assessment;

    // Priority 1: Assessment linked in metadata
    if (metadata?.assessmentId) {
      assessment = await prisma.assessment.findUnique({
        where: { id: metadata.assessmentId }
      });
    }

    // Priority 2: Most recent completed assessment for user
    if (!assessment) {
      assessment = await prisma.assessment.findFirst({
        where: { 
          status: 'completed',
          OR: [
            { sessionId: metadata?.sessionId },
            { lead: { email: payment.user.email } }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    if (assessment && assessment.responses && assessment.results) {
      logger.info('Triggering AI template generation for subscription', { 
        subscriptionId: subscription.id,
        assessmentId: assessment.id 
      });

      // Run in background
      generateTemplateAI(subscription.id, assessment.responses, assessment.results)
        .then(async () => {
          logger.info(`Auto-generated template for subscription ${subscription.id}`);
          // Trigger deployment after template generation
          try {
            const deployment = await deployTemplate(subscription.id);
            if (deployment.success) {
              logger.info(`Automatically deployed site for subscription ${subscription.id}`, { url: deployment.url });
              // Optional: Send deployment success email
            }
          } catch (deployErr) {
            logger.error(`AUTO_DEPLOYMENT_ERROR for subscription ${subscription.id}:`, deployErr);
          }
        })
        .catch(err => logger.error(`AUTO_TEMPLATE_GENERATION_ERROR for subscription ${subscription.id}:`, err));
      
      // Update assessment to link it
      await prisma.assessment.update({
        where: { id: assessment.id },
        data: { convertedToLead: true }
      });
    } else {
      logger.warn('No suitable assessment found for AI template generation', { 
        userId, 
        subscriptionId: subscription.id 
      });
    }
  } catch (error) {
    logger.error('Error in triggerAITemplateGeneration', { 
      subscriptionId: subscription.id, 
      error: error.message 
    });
  }
}

/**
 * Provision addons
 */
async function handleAddonProvisioning(payment) {
  const { metadata } = payment;
  if (!metadata?.addonId || !metadata?.subscriptionId) return;

  try {
    // Mitigate schema mismatch by catching errors on missing columns
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: metadata.subscriptionId },
        select: {
          id: true,
          purchasedAddons: true
        }
      });

      if (!subscription) return;

      let purchasedAddons = subscription.purchasedAddons || [];
      if (!Array.isArray(purchasedAddons)) purchasedAddons = [];

      if (!purchasedAddons.find(a => a.id === metadata.addonId)) {
        purchasedAddons.push({
          id: metadata.addonId,
          name: metadata.addonName,
          purchasedAt: new Date(),
          paymentId: payment.id
        });

        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { purchasedAddons },
          select: { id: true }
        });
      }
    } catch (dbError) {
      if (dbError.message.includes('purchasedAddons')) {
        logger.warn('Skipping purchasedAddons update due to missing column in DB');
        return;
      }
      throw dbError;
    }
  } catch (error) {
    logger.error('Addon provisioning error', { error: error.message });
  }
}

async function sendPaymentSuccessEmail(user, subscription) {
  try {
    await sendEmail({
      to: user.email,
      subject: '✅ Payment Successful - Sitemendr',
      html: `
        <h2>Hi ${user.name},</h2>
        <p>Your payment was successful and your subscription for <strong>${subscription.siteName || 'your website'}</strong> is now active.</p>
        <p>Status: ${subscription.status}</p>
        ${subscription.expiresAt ? `<p>Expires: ${subscription.expiresAt.toDateString()}</p>` : '<p>Lifetime Access: One-time purchase</p>'}
        <p>You can access your dashboard to manage your site.</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Go to Dashboard</a>
      `
    });
  } catch (error) {
    logger.error('Failed to send payment success email', { error: error.message });
  }
}
