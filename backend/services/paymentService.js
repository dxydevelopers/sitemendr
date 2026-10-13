const { prisma } = require('../config/db');
const { getAddon } = require('./addonCatalog');
const logger = require('../config/logger');
const { generateTemplateAI } = require('../controllers/assessment');
const { sendEmail } = require('../config/email');
const { deployTemplate } = require('./deploymentService');
const { recordProjectEvent } = require('./projectConversation');
const { ensureCompletedBuildSite } = require('./projectSiteService');

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
      
      // Update user role to client if they were a basic user
      if (payment.user && payment.user.role === 'user') {
        await prisma.user.update({
          where: { id: userId },
          data: { role: 'client' }
        });
        logger.info('Updated user role to client', { userId });
      }
    } 
    // 2. Handle Add-ons
    else if (serviceType === 'addon') {
      await handleAddonProvisioning(payment);
    }
    // 3. Handle Build agreement deposit/payment
    else if (serviceType === 'build_agreement') {
      await handleBuildAgreementPayment(payment);
    }
    // 4. Handle Build final balance payment
    else if (serviceType === 'build_final_balance') {
      await handleBuildFinalBalancePayment(payment);
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

async function handleBuildAgreementPayment(payment) {
  const projectRequestId = payment.metadata?.projectRequestId;

  if (!projectRequestId) {
    logger.warn('Build agreement payment missing projectRequestId metadata', { paymentId: payment.id });
    return;
  }

  const request = await prisma.projectRequest.findFirst({
    where: {
      id: projectRequestId,
      userId: payment.userId,
      serviceType: 'build'
    }
  });

  if (!request) {
    logger.warn('Build agreement payment project request not found', {
      paymentId: payment.id,
      projectRequestId
    });
    return;
  }

  const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
    where: { projectRequestId, status: 'accepted' },
    orderBy: { version: 'desc' },
    select: { id: true }
  });
  const expectedDepositMinor = Math.round(Number(request.depositAmount || request.totalAgreedAmount || request.quotedAmount || 0) * 100);
  if (request.status !== 'payment_agreement'
    || request.paymentAgreementStatus !== 'sent'
    || !acceptedQuote
    || payment.metadata?.quoteVersionId !== acceptedQuote.id
    || payment.metadata?.termsAccepted !== true
    || String(payment.currency || '').toUpperCase() !== String(request.quoteCurrency || 'USD').toUpperCase()
    || !Number.isFinite(expectedDepositMinor)
    || Number(payment.amount || 0) !== expectedDepositMinor) {
    logger.error('Verified build deposit requires manual reconciliation; agreement state or amount no longer matches', {
      paymentId: payment.id,
      projectRequestId
    });
    return;
  }

  const noteParts = [
    request.clientNotes,
    `Payment received through Paystack.\nReference: ${payment.reference}`
  ].filter(Boolean);

  const agreementTransition = await prisma.projectRequest.updateMany({
    where: { id: request.id, status: 'payment_agreement', paymentAgreementStatus: 'sent' },
    data: {
      paymentAgreementStatus: 'confirmed',
      paymentConfirmedAt: new Date(),
      clientNotes: noteParts.join('\n\n')
    }
  });
  if (agreementTransition.count !== 1) {
    logger.error('Verified build deposit lost a concurrent agreement-state transition and needs manual reconciliation', {
      paymentId: payment.id,
      projectRequestId
    });
    return;
  }

  await recordProjectEvent(request.id, 'deposit_payment_verified', 'Deposit payment verified by Paystack.', {
    amountMinor: payment.amount,
    currency: payment.currency,
    reference: payment.reference,
    quoteVersionId: payment.metadata?.quoteVersionId || null
  });

  logger.info('Build agreement payment confirmed', {
    paymentId: payment.id,
    projectRequestId: request.id,
    reference: payment.reference
  });
}

/**
 * Handle final balance payment for a build request
 */
async function handleBuildFinalBalancePayment(payment) {
  const projectRequestId = payment.metadata?.projectRequestId;

  if (!projectRequestId) {
    logger.warn('Build final balance payment missing projectRequestId metadata', { paymentId: payment.id });
    return;
  }

  const request = await prisma.projectRequest.findFirst({
    where: {
      id: projectRequestId,
      userId: payment.userId,
      serviceType: 'build'
    }
  });

  if (!request) {
    logger.warn('Build final balance payment project request not found', {
      paymentId: payment.id,
      projectRequestId
    });
    return;
  }

  const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
    where: { projectRequestId, status: 'accepted' },
    orderBy: { version: 'desc' },
    select: { id: true, snapshot: true }
  });
  const agreedTotal = Number(request.totalAgreedAmount || acceptedQuote?.snapshot?.totalAgreedAmount || acceptedQuote?.snapshot?.amount || request.quotedAmount || 0);
  const expectedBalance = Math.max(Math.round((agreedTotal - Number(request.depositAmount || 0)) * 100) / 100, 0);
  const expectedBalanceMinor = Math.round(expectedBalance * 100);
  if (request.status !== 'handoff'
    || !request.completionAcknowledgedAt
    || request.handoffIssuesReportedAt
    || request.finalPaymentConfirmedAt
    || !acceptedQuote
    || payment.metadata?.quoteVersionId !== acceptedQuote.id
    || String(payment.currency || '').toUpperCase() !== String(request.quoteCurrency || acceptedQuote.snapshot?.currency || 'USD').toUpperCase()
    || !Number.isFinite(expectedBalanceMinor)
    || Number(payment.amount || 0) !== expectedBalanceMinor) {
    logger.error('Verified final balance requires manual reconciliation; handoff, quote, or amount no longer matches', {
      paymentId: payment.id,
      projectRequestId
    });
    return;
  }

  const noteParts = [
    request.clientNotes,
    `Final balance payment received through Paystack.\nReference: ${payment.reference}`
  ].filter(Boolean);

  const finalPaymentTransition = await prisma.projectRequest.updateMany({
    where: {
      id: request.id,
      status: 'handoff',
      completionAcknowledgedAt: { not: null },
      handoffIssuesReportedAt: null,
      finalPaymentConfirmedAt: null
    },
    data: {
      finalPaymentConfirmedAt: new Date(),
      status: request.completionAcknowledgedAt ? 'completed' : 'handoff',
      completedAt: request.completionAcknowledgedAt ? new Date() : request.completedAt,
      clientNotes: noteParts.join('\n\n')
    }
  });
  if (finalPaymentTransition.count !== 1) {
    logger.error('Verified final balance lost a concurrent handoff-state transition and needs manual reconciliation', {
      paymentId: payment.id,
      projectRequestId
    });
    return;
  }

  if (request.completionAcknowledgedAt) {
    await prisma.buildMilestone.updateMany({
      where: { projectRequestId: request.id },
      data: { status: 'completed', progress: 100 }
    });
  }

  await recordProjectEvent(request.id, 'final_payment_verified', 'Final balance payment verified by Paystack.', {
    amountMinor: payment.amount,
    currency: payment.currency,
    reference: payment.reference
  });
  if (request.completionAcknowledgedAt) {
    await recordProjectEvent(request.id, 'build_completed', 'Build completed after handoff acceptance and final payment were confirmed.');
    await ensureCompletedBuildSite(request.id);
  }

  logger.info('Build final balance payment confirmed', {
    paymentId: payment.id,
    projectRequestId: request.id,
    reference: payment.reference
  });
}
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
  const { metadata, userId } = payment;
  const addon = getAddon(metadata?.addonId);
  const subscriptionId = metadata?.subscriptionId;
  if (!addon || !subscriptionId || payment.serviceType !== 'addon' || payment.status !== 'completed'
    || Number(payment.amount) !== addon.price * 100 || String(payment.currency).toUpperCase() !== 'USD') {
    logger.warn('Addon provisioning rejected because its payment or catalog details do not match', { paymentId: payment.id });
    return;
  }

  try {
    const provisioned = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${subscriptionId}:${addon.id}`}))`;
      const subscription = await tx.subscription.findFirst({
        where: { id: subscriptionId, userId, status: 'active', suspended: false },
        select: { id: true, purchasedAddons: true }
      });
      if (!subscription) return false;

      const purchasedAddons = Array.isArray(subscription.purchasedAddons) ? subscription.purchasedAddons : [];
      if (purchasedAddons.some(item => item === addon.id || item?.id === addon.id)) return true;
      await tx.subscription.update({
        where: { id: subscription.id },
        data: { purchasedAddons: [...purchasedAddons, {
          id: addon.id,
          name: addon.name,
          purchasedAt: new Date().toISOString(),
          paymentId: payment.id,
          fulfillmentMode: addon.fulfillmentMode,
          fulfillmentStatus: addon.fulfillmentMode === 'automatic' ? 'active' : 'pending'
        }] },
        select: { id: true }
      });
      return true;
    });
    if (!provisioned) logger.error('Paid add-on could not be attached: selected site is unavailable', { paymentId: payment.id, subscriptionId });
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
