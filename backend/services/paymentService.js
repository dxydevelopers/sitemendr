const { prisma } = require('../config/db');
const { getAddon } = require('./addonCatalog');
const logger = require('../config/logger');
const { generateTemplateAI } = require('../controllers/assessment');
const { sendEmail } = require('../config/email');
const { deployTemplate } = require('./deploymentService');
const { recordProjectEvent } = require('./projectConversation');
const { ensureCompletedBuildSite } = require('./projectSiteService');
const { issueReceiptForPayment } = require('./billingRecords');
const { notifyUser, notifyAdmins } = require('./socketService');

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

    try {
      await issueReceiptForPayment(payment);
    } catch (receiptError) {
      // Receipt bookkeeping must not prevent a verified payment from advancing its service.
      logger.error('BILLING_RECEIPT_ISSUE_FAILED', { paymentId, error: receiptError.message });
    }

    if (payment.invoiceId) {
      try {
        await prisma.billingInvoice.updateMany({
          where: { id: payment.invoiceId, status: { not: 'paid' } },
          data: { status: 'paid', paidAt: payment.updatedAt || new Date(), voidedAt: null, nextReminderAt: null }
        });
      } catch (invoiceError) {
        logger.error('BILLING_INVOICE_SETTLEMENT_FAILED', { paymentId, invoiceId: payment.invoiceId, error: invoiceError.message });
      }
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
      if (!await handleLateCancelledBuildPayment(payment)) await handleBuildAgreementPayment(payment);
    }
    // 4. Handle Build final balance payment
    else if (serviceType === 'build_final_balance') {
      if (!await handleLateCancelledBuildPayment(payment)) await handleBuildFinalBalancePayment(payment);
    }
    // 5. Handle a payment against an approved cancellation closeout invoice.
    else if (serviceType === 'build_cancellation_closeout') {
      await handleBuildCancellationCloseoutPayment(payment);
    }
    else if (serviceType === 'performance_payment') {
      await handlePerformancePayment(payment);
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

exports.reconcileCompletedPerformancePayments = async (limit = 100) => {
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 100, 1), 500);
  let pending;
  try {
    pending = await prisma.$queryRawUnsafe(
    `SELECT p."id"
     FROM "Payment" p
     JOIN "BillingInvoice" i ON i."id" = p."invoiceId"
     JOIN "ProjectRequest" r ON r."id" = i."projectRequestId"
     WHERE p."status" = 'completed'
       AND p."serviceType" = 'performance_payment'
       AND r."serviceType" = 'performance'
       AND p."userId" = r."userId"
       AND p."metadata"->>'projectRequestId' = r."id"
       AND (
         (p."metadata"->>'paymentStage' = 'balance' AND (
           r."status" = 'awaiting_final_payment'
           OR (r."status" = 'completed' AND NOT EXISTS (
             SELECT 1 FROM "ProjectConversationMessage" m
             WHERE m."projectRequestId" = r."id"
               AND m."eventData"->>'paymentReference' = p."reference"
           ))
         ))
         OR (COALESCE(p."metadata"->>'paymentStage', 'quote') <> 'balance' AND (
           r."status" = 'awaiting_payment'
           OR (r."status" IN ('in_progress', 'ready_for_review', 'awaiting_final_payment', 'completed') AND NOT EXISTS (
             SELECT 1 FROM "ProjectConversationMessage" m
             WHERE m."projectRequestId" = r."id"
               AND m."eventData"->>'paymentReference' = p."reference"
           ))
         ))
       )
     ORDER BY p."updatedAt" ASC
     LIMIT $1`,
      safeLimit
    );
  } catch (error) {
    logger.error('PERFORMANCE_PAYMENT_RECONCILIATION_QUERY_FAILED', { error: error.message });
    return { checked: 0, attempted: 0, failed: true };
  }

  for (const payment of pending) {
    // The handler is idempotent: it repairs the request/event pair without
    // duplicating receipts, invoices, or conversation events.
    await exports.processSuccessfulPayment(payment.id);
  }
  return { checked: pending.length, attempted: pending.length };
};

async function handlePerformancePayment(payment) {
  const requestId = payment.metadata?.projectRequestId;
  const quoteVersionId = payment.metadata?.quoteVersionId;
  const paymentStage = payment.metadata?.paymentStage === 'balance' ? 'balance' : 'quote';
  const expectedRequestStatus = paymentStage === 'balance' ? 'awaiting_final_payment' : 'awaiting_payment';
  if (!requestId || !quoteVersionId || !payment.invoiceId || payment.metadata?.termsAccepted !== true) {
    logger.error('Verified Performance payment is missing its accepted invoice context', { paymentId: payment.id });
    return;
  }

  const [request, quote, invoice] = await Promise.all([
    prisma.projectRequest.findFirst({
      where: { id: requestId, userId: payment.userId, serviceType: 'performance' },
      select: { id: true, userId: true, status: true, title: true }
    }),
    prisma.projectQuoteVersion.findFirst({ where: { id: quoteVersionId, projectRequestId: requestId, status: 'accepted' }, select: { id: true, version: true, snapshot: true } }),
    prisma.billingInvoice.findFirst({ where: { id: payment.invoiceId, projectRequestId: requestId, status: 'paid' }, select: { id: true, amountMinor: true, currency: true, stage: true } })
  ]);
  const quoteSnapshot = quote?.snapshot && typeof quote.snapshot === 'object' ? quote.snapshot : {};
  const expectedAmount = paymentStage === 'balance'
    ? Math.max(0, Math.round((Number(quoteSnapshot.totalAgreedAmount || quoteSnapshot.amount || 0) - Number(quoteSnapshot.depositAmount || 0)) * 100))
    : invoice?.amountMinor;
  if (!request || !quote || !invoice
    || invoice.stage !== (paymentStage === 'balance' ? `performance_balance_${quote.version}` : `performance_quote_${quote.version}`)
    || invoice.amountMinor !== Math.round(Number(payment.amount || 0))
    || (paymentStage === 'balance' && invoice.amountMinor !== expectedAmount)
    || String(invoice.currency).toUpperCase() !== String(payment.currency || '').toUpperCase()) {
    logger.error('Verified Performance payment does not match its accepted invoice; reconciliation is required', {
      paymentId: payment.id,
      requestId
    });
    return;
  }

  const targetRequestStatus = paymentStage === 'balance' ? 'completed' : 'in_progress';
  const recoverableRequestStatuses = paymentStage === 'balance'
    ? [expectedRequestStatus, targetRequestStatus]
    : [expectedRequestStatus, targetRequestStatus, 'ready_for_review', 'awaiting_final_payment', 'completed'];
  const eventType = paymentStage === 'balance' ? 'performance_balance_verified' : 'performance_payment_verified';
  const result = await prisma.$transaction(async tx => {
    const currentRequest = await tx.projectRequest.findFirst({
      where: { id: requestId, userId: payment.userId, serviceType: 'performance' },
      select: { status: true }
    });
    if (!currentRequest || !recoverableRequestStatuses.includes(currentRequest.status)) return null;

    let transitioned = false;
    if (currentRequest.status === expectedRequestStatus) {
      const changed = await tx.projectRequest.updateMany({
        where: { id: requestId, userId: payment.userId, serviceType: 'performance', status: expectedRequestStatus },
        data: paymentStage === 'balance'
          ? { status: 'completed', finalPaymentConfirmedAt: new Date(), completedAt: new Date() }
          : { status: 'in_progress', paymentAgreementStatus: 'confirmed', paymentConfirmedAt: new Date() }
      });
      if (changed.count !== 1) return null;
      transitioned = true;
    }

    // The provider callback and webhook can race, and a prior attempt may have
    // committed the status update before event delivery failed. Key the event
    // to the immutable payment reference so retries repair it without dupes.
    const priorEvent = await tx.projectConversationMessage.findFirst({
      where: {
        projectRequestId: requestId,
        kind: 'event',
        eventData: { path: ['paymentReference'], equals: payment.reference }
      },
      select: { id: true }
    });
    const event = priorEvent ? null : await tx.projectConversationMessage.create({
      data: {
        projectRequestId: requestId,
        senderRole: 'system',
        kind: 'event',
        message: paymentStage === 'balance' ? 'Final balance verified. This Performance request is complete.' : 'Payment verified. Sitemendr can begin the approved Performance work.',
        eventData: {
          type: eventType,
          invoiceId: invoice.id,
          paymentReference: payment.reference,
          amountMinor: payment.amount,
          currency: payment.currency,
          quoteVersionId: quote.id
        }
      }
    });
    return { transitioned, event };
  });
  if (!result) return;
  if (!result.event) {
    if (result.transitioned) logger.warn('Performance payment state transitioned but its event already existed', { paymentId: payment.id, requestId });
    return;
  }

  const event = result.event;
  const updatedRequest = await prisma.projectRequest.findUnique({ where: { id: requestId } });
  notifyUser(payment.userId, 'project_conversation_message', { requestId, message: event });
  notifyAdmins('project_conversation_message', { requestId, message: event });
  notifyUser(payment.userId, 'performance_request_updated', { request: updatedRequest });
  notifyAdmins('performance_request_updated', { request: updatedRequest });
}

async function handleLateCancelledBuildPayment(payment) {
  const projectRequestId = payment.metadata?.projectRequestId;
  if (!projectRequestId) return false;
  const result = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe(
      `SELECT "id", "eventData" FROM "ProjectConversationMessage"
       WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'type' = 'cancel_confirmed'
       AND "eventData"->>'lifecycleStatus' = 'confirmed' ORDER BY "createdAt" DESC LIMIT 1 FOR UPDATE`,
      projectRequestId
    );
    const row = rows[0];
    const settlement = row?.eventData?.cancellationSettlement;
    if (!row || !settlement) return false;
    const paymentReferences = Array.isArray(settlement.paymentReferences) ? settlement.paymentReferences : [];
    if (paymentReferences.includes(payment.reference)) return true;
    const currency = String(payment.currency || 'USD').toUpperCase();
    if (String(settlement.currency || 'USD').toUpperCase() !== currency) {
      logger.error('CANCELLED_BUILD_PAYMENT_CURRENCY_MISMATCH', { paymentId: payment.id, projectRequestId });
      return true;
    }
    const paidTotal = Math.round((Number(settlement.paidTotal || 0) + Number(payment.amount || 0) / 100) * 100) / 100;
    const chargeTotal = Number(settlement.chargeTotal || 0);
    const refundDue = Math.max(Math.round((paidTotal - chargeTotal) * 100) / 100, 0);
    const balanceDue = Math.max(Math.round((chargeTotal - paidTotal) * 100) / 100, 0);
    const refundedTotal = Number(settlement.refundedTotal || 0);
    const updatedSettlement = {
      ...settlement,
      paidTotal,
      refundDue,
      balanceDue,
      paymentReferences: [...paymentReferences, payment.reference],
      refundStatus: refundDue > refundedTotal ? (refundedTotal > 0 ? 'partial' : 'pending') : refundDue > 0 ? 'processed' : 'not_due',
      latePaymentReference: payment.reference,
      latePaymentAt: new Date().toISOString()
    };
    await tx.$executeRawUnsafe(
      `UPDATE "ProjectConversationMessage" SET "eventData" = jsonb_set("eventData", '{cancellationSettlement}', $2::jsonb, true) WHERE "id" = $1`,
      row.id, JSON.stringify(updatedSettlement)
    );
    if (refundDue > refundedTotal) {
      const activeRefund = await tx.billingRefund.findFirst({
        // A late payment can create a new refund obligation after the prior
        // cancellation refund was fully recorded. Reopen the existing project
        // refund record so the client sees one cumulative cancellation refund.
        where: { projectRequestId },
        orderBy: { createdAt: 'asc' }
      });
      const refundAmountMinor = Math.round(refundDue * 100);
      const processedAmountMinor = Math.round(refundedTotal * 100);
      const refundStatus = processedAmountMinor > 0 ? 'partial' : 'pending';
      if (activeRefund) {
        await tx.billingRefund.update({
          where: { id: activeRefund.id },
          data: { amountMinor: refundAmountMinor, processedAmountMinor, status: refundStatus, snapshot: { refundDue, refundedTotal, reason: 'Build cancellation settlement' } }
        });
      } else {
        const lastRefundReference = typeof settlement.lastRefundReference === 'string'
          ? settlement.lastRefundReference
          : null;
        await tx.billingRefund.create({
          data: {
            refundNumber: `SMF-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${require('crypto').randomBytes(4).toString('hex').toUpperCase()}`,
            userId: payment.userId,
            projectRequestId,
            invoiceId: payment.invoiceId || null,
            amountMinor: refundAmountMinor,
            processedAmountMinor,
            currency,
            status: refundStatus,
            externalReference: lastRefundReference,
            externalReferences: lastRefundReference ? [lastRefundReference] : [],
            processedAt: settlement.lastRefundAt ? new Date(settlement.lastRefundAt) : null,
            sourcePaymentReferences: updatedSettlement.paymentReferences,
            snapshot: { refundDue, refundedTotal, reason: 'Build cancellation settlement' }
          }
        });
      }
    }
    return { updatedSettlement };
  });
  if (!result) return false;
  if (result.updatedSettlement) {
    await recordProjectEvent(projectRequestId, 'cancelled_build_payment_reconciled', 'A payment completed while the build was being cancelled. The cancellation settlement was updated.', {
      paymentReference: payment.reference,
      amountMinor: payment.amount,
      currency: payment.currency,
      cancellationSettlement: result.updatedSettlement
    });
  }
  return true;
}

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

async function handleBuildCancellationCloseoutPayment(payment) {
  const projectRequestId = payment.metadata?.projectRequestId;
  if (!projectRequestId || !payment.invoiceId) {
    logger.error('CANCELLATION_CLOSEOUT_PAYMENT_MISSING_LINK', { paymentId: payment.id });
    return;
  }
  const amount = Number(payment.amount || 0) / 100;
  const currency = String(payment.currency || 'USD').toUpperCase();
  const outcome = await prisma.$transaction(async tx => {
    const rows = await tx.$queryRawUnsafe(
      `SELECT "id", "eventData" FROM "ProjectConversationMessage"
       WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'type' = 'cancel_confirmed'
       AND "eventData"->>'lifecycleStatus' = 'confirmed' ORDER BY "createdAt" DESC LIMIT 1 FOR UPDATE`,
      projectRequestId
    );
    const row = rows[0];
    const settlement = row?.eventData?.cancellationSettlement;
    if (!row || !settlement || String(settlement.currency || 'USD').toUpperCase() !== currency) return null;
    const remaining = Number(settlement.balanceDue || 0);
    if (remaining <= 0 || Math.round(amount * 100) !== Math.round(remaining * 100)) return null;
    const paidTotal = Math.round((Number(settlement.paidTotal || 0) + amount) * 100) / 100;
    const balanceDue = Math.max(Math.round((Number(settlement.chargeTotal || 0) - paidTotal) * 100) / 100, 0);
    const updatedSettlement = {
      ...settlement,
      paidTotal,
      balanceDue,
      closeoutPaidAt: new Date().toISOString(),
      closeoutPaymentReference: payment.reference,
      paymentReferences: [...new Set([...(Array.isArray(settlement.paymentReferences) ? settlement.paymentReferences : []), payment.reference])]
    };
    const updatedRows = await tx.$queryRawUnsafe(
      `UPDATE "ProjectConversationMessage" SET "eventData" = jsonb_set("eventData", '{cancellationSettlement}', $2::jsonb, true)
       WHERE "id" = $1 RETURNING "projectRequestId"`,
      row.id, JSON.stringify(updatedSettlement)
    );
    return updatedRows.length ? { settlement: updatedSettlement } : null;
  });
  if (!outcome) {
    logger.error('CANCELLATION_CLOSEOUT_SETTLEMENT_UPDATE_SKIPPED', { paymentId: payment.id, projectRequestId });
    return;
  }
  await recordProjectEvent(
    projectRequestId,
    'cancellation_closeout_payment_verified',
    'Cancellation closeout payment verified by Paystack.',
    { paymentReference: payment.reference, amount, currency, cancellationSettlement: outcome.settlement }
  );
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
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`${subscriptionId}:${addon.id}`})) IS NULL`;
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
