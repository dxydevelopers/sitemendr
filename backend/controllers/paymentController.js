const { prisma } = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');
const { processSuccessfulPayment } = require('../services/paymentService');
const { getAddon } = require('../services/addonCatalog');
const { issueAddonInvoice } = require('../services/billingRecords');
const logger = require('../config/logger');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const isAddonAttached = async (payment) => {
  if (payment.serviceType !== 'addon' || !payment.metadata?.subscriptionId || !payment.metadata?.addonId) return undefined;
  const site = await prisma.subscription.findFirst({
    where: { id: payment.metadata.subscriptionId, userId: payment.userId },
    select: { purchasedAddons: true }
  });
  const purchased = Array.isArray(site?.purchasedAddons) ? site.purchasedAddons : [];
  return purchased.some(item => item === payment.metadata.addonId || item?.id === payment.metadata.addonId);
};

// Verify webhook signature
const verifyWebhookSignature = (req) => {
  const secret = PAYSTACK_WEBHOOK_SECRET;
  const signature = req.headers['x-paystack-signature'];
  
  if (!signature) return false;

  // Use rawBody if available (set in server.js), otherwise fallback to stringified body
  const body = req.rawBody || JSON.stringify(req.body);
  
  const hash = crypto
    .createHmac('sha512', secret)
    .update(body)
    .digest('hex');
    
  return hash === signature;
};

// Initialize payment
exports.initializePayment = async (req, res) => {
  try {
    const { amount, serviceType, description, metadata } = req.body;
    let email = req.body.email?.toLowerCase();
    let authenticatedUser = null;

    if (serviceType === 'addon' && !req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Sign in before buying an add-on.' });
    }
    if (serviceType === 'build_cancellation_closeout' && !req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Sign in before paying a cancellation closeout.' });
    }
    if (serviceType === 'performance_payment' && !req.user?.userId) {
      return res.status(401).json({ success: false, message: 'Sign in before paying a Performance invoice.' });
    }

    // If authenticated, fallback to the user email when not provided
    if (req.user?.userId) {
      authenticatedUser = await prisma.user.findUnique({
        where: { id: req.user.userId }
      });
      if (!email) email = authenticatedUser?.email?.toLowerCase();
    }

    // DEBUG LOG
    if (!email) {
      logger.warn('EMAIL_MISSING_FOR_PAYMENT', { 
        serviceType, 
        hasUser: !!req.user, 
        userId: req.user?.userId,
        body: req.body 
      });
    }

    let finalAmount = amount;
    let finalDescription = description;

    const missing = [];
    if (serviceType !== 'addon' && (finalAmount === undefined || finalAmount === null)) missing.push('amount');
    if (!email) missing.push('email');
    if (!serviceType) missing.push('serviceType');
    if (serviceType !== 'addon' && !finalDescription) missing.push('description');

    if (missing.length) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missing.join(", ")}`
      });
    }

    // Determine User ID (either from auth or find/create by email)
    let userId = req.user?.userId;
    let finalMetadata = {
      country: authenticatedUser?.country || 'US',
      defaultCurrency: authenticatedUser?.defaultCurrency || 'USD',
      accountType: authenticatedUser?.accountType || 'individual',
      billingRegion: authenticatedUser?.billingRegion || authenticatedUser?.country || 'US',
      ...metadata
    };
    
    if (!userId) {
      // Find or create guest user
      let user = await prisma.user.findUnique({ where: { email } });
      
      if (!user) {
        // Create a guest user with a random password and a setup token
        const randomPassword = crypto.randomBytes(16).toString('hex');
        const salt = await require('bcryptjs').genSalt(10);
        const hashedPassword = await require('bcryptjs').hash(randomPassword, salt);
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const passwordResetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        user = await prisma.user.create({
          data: {
            email,
            name: email.split('@')[0], // Use email prefix as name
            password: hashedPassword,
            role: 'user',
            country: finalMetadata.country || 'US',
            defaultCurrency: finalMetadata.currency || finalMetadata.defaultCurrency || 'USD',
            accountType: finalMetadata.accountType || 'individual',
            billingRegion: finalMetadata.billingRegion || finalMetadata.country || 'US',
            passwordResetToken,
            passwordResetExpires
          }
        });

        // Add the raw token and temp password to metadata in case a future
        // notification needs them (e.g. a rebuilt "guest-welcome" flow via notify())
        finalMetadata.isNewGuest = true;
        finalMetadata.setupToken = resetToken;
        finalMetadata.tempPassword = randomPassword;
      }
      userId = user.id;
    }

    if (serviceType === 'addon') {
      const addon = getAddon(finalMetadata.addonId);
      const subscriptionId = typeof finalMetadata.subscriptionId === 'string' ? finalMetadata.subscriptionId : '';
      if (!addon || !subscriptionId) {
        return res.status(400).json({ success: false, message: 'Choose a listed add-on and the site it should be attached to.' });
      }
      const subscription = await prisma.subscription.findFirst({
        where: { id: subscriptionId, userId, status: 'active', suspended: false },
        select: { id: true, siteName: true, purchasedAddons: true }
      });
      if (!subscription) {
        return res.status(403).json({ success: false, message: 'Choose an active site in your workspace.' });
      }
      const currentAddons = Array.isArray(subscription.purchasedAddons) ? subscription.purchasedAddons : [];
      if (currentAddons.some(item => item === addon.id || item?.id === addon.id)) {
        return res.status(409).json({ success: false, message: 'This add-on is already attached to the selected site.' });
      }
      const pendingPurchase = await prisma.payment.findFirst({
        where: {
          userId,
          serviceType: 'addon',
          status: 'pending',
          AND: [
            { metadata: { path: ['addonId'], equals: addon.id } },
            { metadata: { path: ['subscriptionId'], equals: subscriptionId } }
          ]
        },
        select: { id: true, reference: true, amount: true, currency: true, serviceType: true, description: true, metadata: true, invoiceId: true, createdAt: true, gatewayResponse: true }
      });
      if (pendingPurchase) {
        const invoice = await issueAddonInvoice({ userId, subscriptionId, addon, siteName: subscription.siteName });
        if (invoice && !pendingPurchase.invoiceId) {
          await prisma.payment.update({ where: { id: pendingPurchase.id }, data: { invoiceId: invoice.id } });
          pendingPurchase.invoiceId = invoice.id;
        }
        if (invoice) {
          await prisma.billingInvoice.updateMany({ where: { id: invoice.id, status: 'open' }, data: { status: 'processing' } });
        }
        const authorizationUrl = pendingPurchase.gatewayResponse?.authorization_url;
        if (authorizationUrl) {
          return res.json({
            success: true,
            message: 'Resuming your pending add-on checkout.',
            data: { payment: pendingPurchase, publicKey: PAYSTACK_PUBLIC_KEY, paystack: pendingPurchase.gatewayResponse }
          });
        }
        return res.status(409).json({ success: false, message: 'A checkout for this add-on is still being prepared. Please try again shortly.' });
      }

      finalAmount = addon.price;
      finalDescription = `Purchase of ${addon.name} Add-on`;
      finalMetadata = { ...finalMetadata, addonId: addon.id, addonName: addon.name, subscriptionId, siteName: subscription.siteName };
    }

    // Generate unique reference
    const reference = `sitemendr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allowedPaystackChannels = new Set(['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'eft']);
    const selectedPaymentChannels = Array.isArray(finalMetadata.selectedPaymentChannels)
      ? finalMetadata.selectedPaymentChannels.filter(channel => allowedPaystackChannels.has(channel))
      : [];

    let sourceCurrency = finalMetadata.currency || finalMetadata.defaultCurrency || 'USD';
    let targetCurrency = sourceCurrency || process.env.PAYSTACK_CURRENCY || 'USD';
    let paystackAmount = finalAmount;

    if (serviceType === 'addon') {
      sourceCurrency = 'USD';
      targetCurrency = 'USD';
      paystackAmount = finalAmount;
      finalMetadata.currency = 'USD';
    }

    if (serviceType === 'build_agreement' && !finalMetadata.projectRequestId) {
      return res.status(400).json({ success: false, message: 'A build request is required for deposit checkout.' });
    }

    if (serviceType === 'build_agreement' && finalMetadata.projectRequestId) {
      const request = await prisma.projectRequest.findFirst({
        where: { id: finalMetadata.projectRequestId, userId, serviceType: 'build' },
        select: { status: true, paymentAgreementStatus: true, quotedAmount: true, quoteCurrency: true, totalAgreedAmount: true, depositAmount: true, paymentAgreementType: true, paymentDueDate: true }
      });
      const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
        where: { projectRequestId: finalMetadata.projectRequestId, status: 'accepted' },
        orderBy: { version: 'desc' },
        select: { id: true, snapshot: true }
      });
      const expectedAmount = request?.depositAmount || request?.totalAgreedAmount || request?.quotedAmount || 0;
      if (!request || request.status !== 'payment_agreement' || request.paymentAgreementStatus !== 'sent' || !acceptedQuote || finalMetadata.quoteVersionId !== acceptedQuote.id || finalMetadata.termsAccepted !== true) {
        return res.status(409).json({ success: false, message: 'Accept the current quote and wait for the admin payment request before paying the deposit.' });
      }
      const expectedAmountMinor = Math.round(Number(expectedAmount) * 100);
      const checkoutAmountMinor = Math.round(Number(finalAmount) * 100);
      if (!Number.isFinite(expectedAmountMinor) || expectedAmountMinor <= 0 || checkoutAmountMinor !== expectedAmountMinor) {
        return res.status(400).json({ success: false, message: 'The checkout amount does not match the agreed deposit.' });
      }
      finalAmount = expectedAmountMinor / 100;
      const quoteCurrency = String(request.quoteCurrency || acceptedQuote.snapshot?.currency || 'USD').toUpperCase();
      if (String(sourceCurrency).toUpperCase() !== quoteCurrency) {
        return res.status(400).json({ success: false, message: 'The deposit currency must match the accepted quote.' });
      }
      sourceCurrency = quoteCurrency;
      targetCurrency = quoteCurrency;
      finalMetadata.quoteVersionId = acceptedQuote.id;
      finalMetadata.acceptedTermsSnapshot = {
        ...acceptedQuote.snapshot,
        quoteVersionId: acceptedQuote.id,
        totalAgreedAmount: request.totalAgreedAmount || request.quotedAmount,
        depositAmount: expectedAmount,
        currency: request.quoteCurrency,
        paymentSchedule: request.paymentAgreementType,
        paymentDueDate: request.paymentDueDate,
        cancellationTerms: 'On confirmed cancellation, completed milestones and listed pre-approved non-recoverable costs already incurred are charged. Any prepaid amount above that is refunded.'
      };
    }

    if (serviceType === 'build_final_balance') {
      const projectRequestId = finalMetadata.projectRequestId;
      if (!projectRequestId) return res.status(400).json({ success: false, message: 'A build request is required for final-balance checkout.' });
      const request = await prisma.projectRequest.findFirst({
        where: { id: projectRequestId, userId, serviceType: 'build' },
        select: {
          id: true, status: true, completionAcknowledgedAt: true, handoffIssuesReportedAt: true, finalPaymentConfirmedAt: true,
          quotedAmount: true, totalAgreedAmount: true, depositAmount: true, quoteCurrency: true
        }
      });
      const acceptedQuote = await prisma.projectQuoteVersion.findFirst({
        where: { projectRequestId, status: 'accepted' },
        orderBy: { version: 'desc' },
        select: { id: true, snapshot: true }
      });
      if (!request || request.status !== 'handoff' || !request.completionAcknowledgedAt || request.handoffIssuesReportedAt || request.finalPaymentConfirmedAt || !acceptedQuote) {
        return res.status(409).json({ success: false, message: 'Accept the live handoff before starting final-balance checkout.' });
      }
      const totalAgreed = Number(request.totalAgreedAmount || acceptedQuote.snapshot?.totalAgreedAmount || acceptedQuote.snapshot?.amount || request.quotedAmount || 0);
      const deposit = Number(request.depositAmount || 0);
      const expectedBalance = Math.max(Math.round((totalAgreed - deposit) * 100) / 100, 0);
      const expectedBalanceMinor = Math.round(expectedBalance * 100);
      const checkoutAmountMinor = Math.round(Number(finalAmount) * 100);
      const quoteCurrency = String(request.quoteCurrency || acceptedQuote.snapshot?.currency || 'USD').toUpperCase();
      if (!Number.isFinite(expectedBalanceMinor) || expectedBalanceMinor <= 0 || checkoutAmountMinor !== expectedBalanceMinor) {
        return res.status(400).json({ success: false, message: 'The final payment amount does not match the unpaid balance on the accepted agreement.' });
      }
      if (String(sourceCurrency).toUpperCase() !== quoteCurrency) {
        return res.status(400).json({ success: false, message: 'The final payment currency must match the accepted quote.' });
      }
      finalAmount = expectedBalance;
      sourceCurrency = quoteCurrency;
      targetCurrency = quoteCurrency;
      finalMetadata.quoteCurrency = quoteCurrency;
      finalMetadata.quoteVersionId = acceptedQuote.id;
      finalMetadata.acceptedQuoteSnapshot = acceptedQuote.snapshot;
    }

    let performanceInvoiceId = null;
    if (serviceType === 'performance_payment') {
      const projectRequestId = finalMetadata.projectRequestId;
      const quoteVersionId = finalMetadata.quoteVersionId;
      if (!projectRequestId || !quoteVersionId || finalMetadata.termsAccepted !== true) {
        return res.status(400).json({ success: false, message: 'Accept the current Performance proposal before starting payment.' });
      }
      const paymentStage = finalMetadata.paymentStage === 'balance' ? 'balance' : 'quote';
      const requestStatus = paymentStage === 'balance' ? 'awaiting_final_payment' : 'awaiting_payment';
      const request = await prisma.projectRequest.findFirst({
        where: { id: projectRequestId, userId, serviceType: 'performance', status: requestStatus },
        select: { id: true, title: true, status: true, subscriptionId: true, businessName: true }
      });
      const quote = await prisma.projectQuoteVersion.findFirst({
        where: { id: quoteVersionId, projectRequestId, status: 'accepted' },
        select: { id: true, version: true, snapshot: true }
      });
      if (!request || !quote) return res.status(409).json({ success: false, message: 'The accepted Performance proposal is no longer payable.' });
      const snapshot = quote.snapshot && typeof quote.snapshot === 'object' ? quote.snapshot : {};
      const expectedAmount = paymentStage === 'balance'
        ? Math.max(0, Math.round((Number(snapshot.totalAgreedAmount || snapshot.amount || 0) - Number(snapshot.depositAmount || 0)) * 100) / 100)
        : snapshot.paymentSchedule === 'deposit_balance'
          ? Number(snapshot.depositAmount || 0)
          : Number(snapshot.totalAgreedAmount || snapshot.amount || 0);
      const currency = String(snapshot.currency || 'USD').toUpperCase();
      const stage = paymentStage === 'balance' ? `performance_balance_${quote.version}` : `performance_quote_${quote.version}`;
      const invoice = await prisma.billingInvoice.findUnique({
        where: { projectRequestId_stage: { projectRequestId, stage } },
        select: { id: true, projectRequestId: true, amountMinor: true, currency: true, status: true, description: true }
      });
      const expectedMinor = Math.round(expectedAmount * 100);
      if (!invoice || invoice.projectRequestId !== projectRequestId || invoice.amountMinor !== expectedMinor
        || invoice.currency !== currency || ['paid', 'void'].includes(invoice.status)) {
        return res.status(409).json({ success: false, message: 'The Performance invoice is unavailable or no longer matches the accepted proposal.' });
      }
      if (invoice.status === 'processing') {
        const pendingPayment = await prisma.payment.findFirst({
          where: { userId, invoiceId: invoice.id, serviceType: 'performance_payment', status: 'pending' },
          select: { id: true, reference: true, amount: true, currency: true, serviceType: true, description: true, metadata: true, invoiceId: true, createdAt: true, gatewayResponse: true }
        });
        if (pendingPayment?.gatewayResponse?.authorization_url) {
          return res.json({
            success: true,
            message: 'Resuming the pending Performance invoice checkout.',
            data: { payment: pendingPayment, publicKey: PAYSTACK_PUBLIC_KEY, paystack: pendingPayment.gatewayResponse }
          });
        }
      }
      if (!Number.isSafeInteger(expectedMinor) || Math.round(Number(finalAmount) * 100) !== expectedMinor
        || String(sourceCurrency).toUpperCase() !== currency) {
        return res.status(400).json({ success: false, message: 'The checkout amount and currency must match the accepted Performance invoice.' });
      }
      finalAmount = expectedMinor / 100;
      sourceCurrency = currency;
      targetCurrency = currency;
      finalDescription = invoice.description;
      finalMetadata = {
        ...finalMetadata,
        paymentStage,
        invoiceId: invoice.id,
        currency,
        quoteVersionId: quote.id,
        subscriptionId: request.subscriptionId,
        siteName: request.businessName || null
      };
      performanceInvoiceId = invoice.id;
    }

    if (serviceType === 'build_cancellation_closeout') {
      const projectRequestId = finalMetadata.projectRequestId;
      if (!projectRequestId) return res.status(400).json({ success: false, message: 'A cancelled build is required for closeout payment.' });
      const request = await prisma.projectRequest.findFirst({
        where: { id: projectRequestId, userId, serviceType: 'build', status: 'cancelled' },
        select: { id: true, title: true, businessName: true, quoteCurrency: true }
      });
      if (!request) return res.status(409).json({ success: false, message: 'This build is not awaiting a cancellation closeout payment.' });
      const events = await prisma.$queryRawUnsafe(
        `SELECT "eventData"->'cancellationSettlement' AS "settlement" FROM "ProjectConversationMessage"
         WHERE "projectRequestId" = $1 AND "kind" = 'event' AND "eventData"->>'type' = 'cancel_confirmed'
         AND "eventData"->>'lifecycleStatus' = 'confirmed' ORDER BY "createdAt" DESC LIMIT 1`, projectRequestId
      );
      const settlement = events[0]?.settlement;
      const expectedAmount = Number(settlement?.balanceDue || 0);
      const quoteCurrency = String(settlement?.currency || request.quoteCurrency || 'USD').toUpperCase();
      const invoice = await prisma.billingInvoice.findUnique({
        where: { projectRequestId_stage: { projectRequestId, stage: 'cancellation_closeout' } },
        select: { id: true, amountMinor: true, currency: true, status: true }
      });
      if (!settlement || expectedAmount <= 0 || !invoice || invoice.amountMinor !== Math.round(expectedAmount * 100)
        || invoice.currency !== quoteCurrency || ['paid', 'void'].includes(invoice.status)) {
        return res.status(409).json({ success: false, message: 'There is no payable cancellation closeout invoice for this build.' });
      }
      if (Math.round(Number(finalAmount) * 100) !== invoice.amountMinor || String(sourceCurrency).toUpperCase() !== invoice.currency) {
        return res.status(400).json({ success: false, message: 'The checkout amount and currency must match the cancellation closeout invoice.' });
      }
      finalAmount = invoice.amountMinor / 100;
      sourceCurrency = invoice.currency;
      targetCurrency = invoice.currency;
      finalDescription = invoice.description;
      finalMetadata.closeoutInvoiceId = invoice.id;
      finalMetadata.currency = invoice.currency;
    }

    // Only convert if explicitly configured to use NGN and input is USD
    if (sourceCurrency === 'USD' && targetCurrency === 'NGN') {
      // Dynamic conversion logic if needed
      const rate = 1500; 
      paystackAmount = finalAmount * rate;
      logger.info('Converting USD to NGN for Paystack', { original: finalAmount, converted: paystackAmount, rate });
    }

    // Link this checkout attempt to the durable invoice for its payable build stage.
    let invoiceId = performanceInvoiceId;
    if (serviceType === 'addon') {
      const invoice = await issueAddonInvoice({
        userId,
        subscriptionId: finalMetadata.subscriptionId,
        addon: getAddon(finalMetadata.addonId),
        siteName: finalMetadata.siteName
      });
      if (!invoice || invoice.amountMinor !== Math.round(finalAmount * 100) || invoice.currency !== targetCurrency || ['paid', 'void'].includes(invoice.status)) {
        return res.status(409).json({ success: false, message: 'The add-on invoice is unavailable or no longer matches this checkout. Refresh the workspace and try again.' });
      }
      invoiceId = invoice.id;
    }
    if (['build_agreement', 'build_final_balance', 'build_cancellation_closeout'].includes(serviceType)) {
      const stage = serviceType === 'build_agreement' ? 'deposit' : serviceType === 'build_final_balance' ? 'final_balance' : 'cancellation_closeout';
      const invoice = await prisma.billingInvoice.findUnique({
        where: { projectRequestId_stage: { projectRequestId: finalMetadata.projectRequestId, stage } },
        select: { id: true, amountMinor: true, currency: true, status: true }
      });
      if (!invoice || invoice.amountMinor !== Math.round(finalAmount * 100)
        || invoice.currency !== targetCurrency
        || ['paid', 'void'].includes(invoice.status)) {
        return res.status(409).json({ success: false, message: 'The payable invoice no longer matches this checkout. Ask the Sitemendr team to refresh the payment request.' });
      }
      invoiceId = invoice.id;
    }

    // Only replace a prior pending attempt once this checkout has passed all
    // terms and invoice checks, so a rejected retry cannot invalidate it.
    if (['build_agreement', 'build_final_balance', 'build_cancellation_closeout'].includes(serviceType) && finalMetadata.projectRequestId) {
      await prisma.payment.updateMany({
        where: {
          userId,
          serviceType,
          status: 'pending',
          metadata: { path: ['projectRequestId'], equals: finalMetadata.projectRequestId }
        },
        data: { status: 'superseded' }
      });
    }

    let payment;
    if (serviceType === 'performance_payment') {
      const checkout = await prisma.$transaction(async tx => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${`performance-invoice:${invoiceId}`})) IS NULL`;
        const payableInvoice = await tx.billingInvoice.findFirst({
          where: {
            id: invoiceId,
            userId,
            projectRequestId: finalMetadata.projectRequestId,
            amountMinor: Math.round(finalAmount * 100),
            currency: targetCurrency,
            status: { notIn: ['paid', 'void'] }
          },
          select: { id: true }
        });
        if (!payableInvoice) return { kind: 'unavailable' };

        const openAttempts = await tx.payment.findMany({
          where: { userId, invoiceId, serviceType: 'performance_payment', status: { in: ['pending', 'processing'] } },
          orderBy: { createdAt: 'desc' },
          select: { id: true, reference: true, amount: true, currency: true, serviceType: true, description: true, metadata: true, invoiceId: true, createdAt: true, gatewayResponse: true }
        });
        const resumable = openAttempts.find(attempt => attempt.gatewayResponse?.authorization_url);
        if (resumable) return { kind: 'resume', payment: resumable };

        // A provider request can succeed while its response is lost. Do not
        // create another reference just because an authorization URL was not
        // saved; reconcile the existing attempt before allowing a new charge.
        if (openAttempts.length) return { kind: 'initializing' };

        const createdPayment = await tx.payment.create({
          data: {
            userId,
            reference,
            amount: Math.round(paystackAmount * 100),
            currency: targetCurrency,
            serviceType,
            description: finalDescription,
            metadata: finalMetadata,
            invoiceId
          }
        });
        const invoiceClaim = await tx.billingInvoice.updateMany({
          where: { id: invoiceId, userId, status: { notIn: ['paid', 'void'] } },
          data: { status: 'processing' }
        });
        if (invoiceClaim.count !== 1) throw Object.assign(new Error('The Performance invoice changed while checkout was starting.'), { code: 'PERFORMANCE_INVOICE_CHANGED' });
        return { kind: 'created', payment: createdPayment };
      });

      if (checkout.kind === 'resume') {
        return res.json({
          success: true,
          message: 'Resuming the pending Performance invoice checkout.',
          data: { payment: checkout.payment, publicKey: PAYSTACK_PUBLIC_KEY, paystack: checkout.payment.gatewayResponse }
        });
      }
      if (checkout.kind === 'initializing') {
        return res.status(409).json({ success: false, message: 'A checkout for this Performance invoice is still being reconciled. Please contact Sitemendr if it remains this way before trying another payment.' });
      }
      if (checkout.kind === 'unavailable') {
        return res.status(409).json({ success: false, message: 'The Performance invoice is no longer available for payment. Refresh the workspace and try again.' });
      }
      payment = checkout.payment;
    } else {
      payment = await prisma.payment.create({
        data: {
          userId,
          reference,
          amount: Math.round(paystackAmount * 100), // Convert to subunits (cents/kobo)
          currency: targetCurrency,
          serviceType,
          description: finalDescription,
          metadata: finalMetadata,
          invoiceId
        }
      });
      if (invoiceId) {
        await prisma.billingInvoice.updateMany({
          where: { id: invoiceId, status: { not: 'paid' } },
          data: { status: 'processing' }
        });
      }
    }

    // Initialize Paystack payment
    const koboAmount = Math.round(paystackAmount * 100);
    logger.info('Initializing Paystack transaction', {
      email,
      amount: koboAmount,
      currency: targetCurrency,
      reference,
      hasSecretKey: !!PAYSTACK_SECRET_KEY,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`
    });

    try {
      const paystackData = {
        amount: koboAmount,
        email,
        currency: targetCurrency,
        reference,
        callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
        metadata: {
          payment_id: payment.id,
          service_type: serviceType,
          ...finalMetadata
        }
      };

      if (selectedPaymentChannels.length) {
        paystackData.channels = selectedPaymentChannels;
      }

      if (!PAYSTACK_SECRET_KEY) {
        throw new Error('PAYSTACK_SECRET_KEY is missing');
      }

      const paystackHeaders = {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      };
      let paystackResponse;
      try {
        paystackResponse = await axios.post(
          `${PAYSTACK_BASE_URL}/transaction/initialize`,
          paystackData,
          {
            headers: paystackHeaders,
            timeout: 20000 // 20 seconds timeout
          }
        );
      } catch (channelError) {
        const channelErrorData = channelError.response?.data;
        const shouldRetryWithoutChannels = selectedPaymentChannels.length
          && channelError.response?.status === 400
          && channelErrorData?.code === 'invalid_params'
          && /No active channel/i.test(channelErrorData?.message || '');

        if (!shouldRetryWithoutChannels) {
          throw channelError;
        }

        const fallbackPaystackData = { ...paystackData };
        delete fallbackPaystackData.channels;
        logger.warn('Retrying Paystack initialization without forced channels', {
          reference,
          selectedPaymentChannels,
          paystackMessage: channelErrorData?.message
        });

        paystackResponse = await axios.post(
          `${PAYSTACK_BASE_URL}/transaction/initialize`,
          fallbackPaystackData,
          {
            headers: paystackHeaders,
            timeout: 20000
          }
        );
      }

      logger.info('Paystack initialization response received', { 
        status: paystackResponse.data.status,
        message: paystackResponse.data.message,
        reference
      });

      if (!paystackResponse.data.status) {
        throw new Error(paystackResponse.data.message || 'Paystack initialization failed');
      }

      await prisma.payment.update({
        where: { id: payment.id },
        data: { gatewayResponse: paystackResponse.data.data }
      });

      res.json({
        success: true,
        data: {
          payment,
          publicKey: PAYSTACK_PUBLIC_KEY,
          paystack: paystackResponse.data.data // Paystack returns data in a 'data' field
        }
      });
    } catch (paystackError) {
      const errorData = paystackError.response?.data;
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          gatewayResponse: errorData || { message: paystackError.message }
        }
      }).catch(updateError => {
        logger.error('Failed to mark payment initialization attempt failed', {
          errorCode: 'PAYMENT_INIT_STATUS_UPDATE_ERROR',
          error: updateError.message,
          reference
        });
      });
      if (invoiceId) {
        try {
          const anotherAttempt = await prisma.payment.findFirst({
            where: { invoiceId, status: { in: ['pending', 'processing'] }, id: { not: payment.id } },
            select: { id: true }
          });
          if (!anotherAttempt) {
            await prisma.billingInvoice.updateMany({
              where: { id: invoiceId, status: 'processing' },
              data: { status: 'open' }
            });
          }
        } catch (updateError) {
          logger.error('Failed to reconcile invoice after checkout initialization failure', {
            invoiceId,
            error: updateError.message
          });
        }
      }
      logger.error('Paystack API call failed', {
        errorCode: 'PAYSTACK_API_ERROR',
        message: paystackError.message,
        paystackResponse: errorData,
        reference
      });
      throw paystackError;
    }
  } catch (error) {
    const errorData = error.response?.data;
    logger.error('Failed to initialize payment', {
      errorCode: 'INITIALIZE_PAYMENT_ERROR',
      error: error.message,
      paystackError: errorData
    });
    res.status(error.response?.status || 500).json({
      success: false,
      message: errorData?.message || error.message || 'Failed to initialize payment',
      error: errorData || error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Verify payment (existing function, adding reactivation check)
exports.verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const storedPayment = await prisma.payment.findUnique({ where: { reference } });
    if (!storedPayment) return res.status(404).json({ success: false, message: 'Payment reference not found.' });

    // A payment reference is not an authorization token. Keep verification
    // scoped to the signed-in account even if someone guesses another reference.
    if (storedPayment.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Payment reference not found.' });
    }

    // Verify with Paystack
    const paystackResponse = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { data } = paystackResponse.data;

    if (data.reference !== reference
      || Math.round(Number(data.amount)) !== Math.round(Number(storedPayment.amount))
      || String(data.currency || '').toUpperCase() !== String(storedPayment.currency || '').toUpperCase()) {
      logger.error('Paystack verification did not match the stored payment', {
        errorCode: 'PAYMENT_VERIFICATION_MISMATCH',
        paymentId: storedPayment.id,
        reference
      });
      return res.status(409).json({ success: false, message: 'The verified transaction does not match this payment record. Contact support before retrying.' });
    }

    if (storedPayment.status === 'completed') {
      let addonProvisioned;
      if (storedPayment.serviceType === 'addon') {
        await processSuccessfulPayment(storedPayment.id);
        addonProvisioned = await isAddonAttached(storedPayment);
      } else if (storedPayment.serviceType === 'performance_payment') {
        // Retry idempotent request/event reconciliation if an earlier callback
        // recorded payment success but failed while advancing the request.
        await processSuccessfulPayment(storedPayment.id);
      }
      return res.json({ success: true, data: { payment: storedPayment, paystack: data, addonProvisioned } });
    }

    // A verification callback and the Paystack webhook can arrive together.
    // Only the first transition to completed should trigger provisioning.
    const verifiedStatus = String(data.status || '').toLowerCase();
    const terminalFailure = ['failed', 'abandoned'].includes(verifiedStatus);
    const paymentInProgress = ['pending', 'ongoing', 'processing'].includes(verifiedStatus);
    const paymentTransition = (verifiedStatus === 'success' || terminalFailure)
      ? await prisma.payment.updateMany({
          where: { reference, status: { not: 'completed' } },
          data: {
            status: verifiedStatus === 'success' ? 'completed' : 'failed',
            gatewayResponse: data
          }
        })
      : paymentInProgress ? await prisma.payment.updateMany({
          where: { reference, status: { in: ['pending', 'processing', 'failed'] } },
          data: { status: 'pending', gatewayResponse: data }
        }) : { count: 0 };
    const payment = await prisma.payment.findUnique({ where: { reference } });
    if (!payment) return res.status(404).json({ success: false, message: 'Payment reference not found.' });
    if (paymentInProgress && payment.status === 'pending' && payment.invoiceId) {
      await prisma.billingInvoice.updateMany({
        where: { id: payment.invoiceId, status: 'open' },
        data: { status: 'processing' }
      });
    }
    if (terminalFailure && payment.status === 'failed' && payment.invoiceId) {
      const anotherAttempt = await prisma.payment.findFirst({
        where: { invoiceId: payment.invoiceId, status: { in: ['pending', 'processing'] }, id: { not: payment.id } },
        select: { id: true }
      });
      if (!anotherAttempt) {
        await prisma.billingInvoice.updateMany({
          where: { id: payment.invoiceId, status: 'processing' },
          data: { status: 'open' }
        });
      }
    }

    // Performance reconciliation is idempotent and can repair a prior partial
    // callback, while other services still provision only on the first transition.
    if (verifiedStatus === 'success'
      && (paymentTransition.count > 0 || payment.serviceType === 'performance_payment')) {
      try {
        await processSuccessfulPayment(payment.id);
        // NOTE: guest welcome email removed as part of notification cleanup.
        // If this needs an email again later, wire it via notify() and the registry.
      } catch (processingError) {
        logger.error('Post-payment processing failed after verification', {
          errorCode: 'POST_PAYMENT_PROCESSING_ERROR',
          error: processingError.message
        });
      }
    }

    const addonProvisioned = verifiedStatus === 'success' && payment.serviceType === 'addon'
      ? await isAddonAttached(payment)
      : undefined;

    res.json({
      success: true,
      data: {
        payment,
        paystack: data,
        addonProvisioned
      }
    });
  } catch (error) {
    logger.error('Failed to verify payment', {
      errorCode: 'VERIFY_PAYMENT_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

// Handle Paystack webhook (existing function, adding reactivation)
exports.handleWebhook = async (req, res) => {
  try {
    logger.info('Webhook received', {
      provider: 'paystack',
      ip: req.ip
    });

    // Verify webhook signature
    if (!verifyWebhookSignature(req)) {
      logger.warn('Invalid webhook signature received', {
        errorCode: 'INVALID_WEBHOOK_SIGNATURE',
        hasSignature: Boolean(req.headers['x-paystack-signature'])
      });
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    logger.info('Webhook verified', {
      provider: 'paystack',
      event: event?.event,
      reference: event?.data?.reference
    });

    if (event.event === 'charge.success') {
      const { reference } = event.data;

      const storedPayment = await prisma.payment.findUnique({ where: { reference } });
      if (!storedPayment) {
        logger.error('Successful Paystack webhook has no matching local payment', { reference });
        return res.json({ received: true });
      }
      if (Math.round(Number(event.data.amount)) !== Math.round(Number(storedPayment.amount))
        || String(event.data.currency || '').toUpperCase() !== String(storedPayment.currency || '').toUpperCase()) {
        logger.error('Paystack webhook did not match the stored payment', {
          errorCode: 'PAYMENT_WEBHOOK_MISMATCH',
          paymentId: storedPayment.id,
          reference
        });
        return res.json({ received: true });
      }

      // A webhook may race the browser verification callback or be retried.
      const paymentTransition = await prisma.payment.updateMany({
        where: { reference, status: { not: 'completed' } },
        data: {
          status: 'completed',
          gatewayResponse: event.data
        }
      });
      const payment = await prisma.payment.findUnique({ where: { reference } });

      logger.info('Payment marked completed from webhook', {
        reference,
        paymentId: payment.id
      });

      // Trigger post-payment processing
      try {
        if (paymentTransition.count > 0 || payment.serviceType === 'performance_payment') {
          await processSuccessfulPayment(payment.id);
        }
        // NOTE: guest welcome email removed as part of notification cleanup.
        // If this needs an email again later, wire it via notify() and the registry.
      } catch (processingError) {
        logger.error('Webhook post-payment processing failed', {
          errorCode: 'WEBHOOK_PROCESSING_ERROR',
          error: processingError.message
        });
      }
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing failed', {
      errorCode: 'WEBHOOK_PROCESSING_ERROR',
      error: error.message
    });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

// Get user payments (existing)
exports.getUserPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Failed to get user payments', {
      errorCode: 'GET_USER_PAYMENTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
};

// Get single payment (existing)
exports.getPayment = async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (payment.userId !== req.user.userId && req.user.role !== 'admin') {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Failed to get payment', {
      errorCode: 'GET_PAYMENT_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment'
    });
  }
};

// Get all payments (admin) (existing)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    logger.error('Admin failed to get all payments', {
      errorCode: 'GET_ALL_PAYMENTS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payments'
    });
  }
};

// Get payment stats (admin) (existing)
exports.getPaymentStats = async (req, res) => {
  try {
    const totalPayments = await prisma.payment.count();
    const completedPayments = await prisma.payment.count({
      where: { status: 'completed' }
    });
    const totalAmount = await prisma.payment.aggregate({
      where: { status: 'completed' },
      _sum: { amount: true }
    });

    res.json({
      success: true,
      data: {
        totalPayments,
        completedPayments,
        failedPayments: totalPayments - completedPayments,
        totalAmount: totalAmount._sum.amount || 0
      }
    });
  } catch (error) {
    logger.error('Admin failed to get payment stats', {
      errorCode: 'GET_PAYMENT_STATS_ERROR',
      error: error.message
    });
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment stats'
    });
  }
};
