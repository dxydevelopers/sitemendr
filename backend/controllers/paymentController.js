const { prisma } = require('../config/db');
const axios = require('axios');
const crypto = require('crypto');
const { processSuccessfulPayment } = require('../services/paymentService');
const logger = require('../config/logger');

// Paystack configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

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

    // Handle Supporter Tier Initialization (Backend determines amount)
    if (serviceType === 'supporter' && metadata?.tierId) {
      if (!prisma.supporterTier) {
        logger.error('PRISMA_MODEL_MISSING', { model: 'supporterTier' });
        return res.status(500).json({
          success: false,
          message: 'Supporter features are not initialized in the database client. Please run "npx prisma generate" on the server.'
        });
      }

      const tier = await prisma.supporterTier.findUnique({
        where: { id: metadata.tierId }
      });
      
      if (!tier) {
        return res.status(404).json({
          success: false,
          message: 'Supporter tier not found'
        });
      }
      
      finalAmount = tier.monthlyPrice;
      finalDescription = `Sitemendr Supporter: ${tier.name}`;
    }

    const missing = [];
    if (finalAmount === undefined || finalAmount === null) missing.push('amount');
    if (!email) missing.push('email');
    if (!serviceType) missing.push('serviceType');
    if (!finalDescription) missing.push('description');

    if (missing.length) {
      // Specialized error for supporter tier if not logged in
      if (serviceType === 'supporter' && !email && !req.user?.userId) {
        return res.status(401).json({
          success: false,
          message: 'Please log in to become a supporter. We need your account to track your rewards and discounts.',
          requiresAuth: true
        });
      }

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

    // Generate unique reference
    const reference = `sitemendr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const allowedPaystackChannels = new Set(['card', 'bank', 'bank_transfer', 'ussd', 'qr', 'mobile_money', 'eft']);
    const selectedPaymentChannels = Array.isArray(finalMetadata.selectedPaymentChannels)
      ? finalMetadata.selectedPaymentChannels.filter(channel => allowedPaystackChannels.has(channel))
      : [];

    const sourceCurrency = finalMetadata.currency || finalMetadata.defaultCurrency || 'USD';
    const targetCurrency = sourceCurrency || process.env.PAYSTACK_CURRENCY || 'USD';
    let paystackAmount = finalAmount;

    // Only convert if explicitly configured to use NGN and input is USD
    if (sourceCurrency === 'USD' && targetCurrency === 'NGN') {
      // Dynamic conversion logic if needed
      const rate = 1500; 
      paystackAmount = finalAmount * rate;
      logger.info('Converting USD to NGN for Paystack', { original: finalAmount, converted: paystackAmount, rate });
    }

    if (serviceType === 'build_agreement' && finalMetadata.projectRequestId) {
      await prisma.payment.updateMany({
        where: {
          userId,
          serviceType: 'build_agreement',
          status: 'pending',
          metadata: {
            path: ['projectRequestId'],
            equals: finalMetadata.projectRequestId
          }
        },
        data: { status: 'superseded' }
      });
    }

    if (serviceType === 'build_final_balance' && finalMetadata.projectRequestId) {
      await prisma.payment.updateMany({
        where: {
          userId,
          serviceType: 'build_final_balance',
          status: 'pending',
          metadata: {
            path: ['projectRequestId'],
            equals: finalMetadata.projectRequestId
          }
        },
        data: { status: 'superseded' }
      });
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        reference,
        amount: Math.round(paystackAmount * 100), // Convert to subunits (cents/kobo)
        currency: targetCurrency,
        serviceType,
        description: finalDescription,
        metadata: finalMetadata
      }
    });

    // Initialize Paystack payment
    const koboAmount = Math.round(paystackAmount * 100);
    logger.info('Initializing Paystack transaction', {
      email,
      amount: koboAmount,
      currency: targetCurrency,
      reference,
      hasSecretKey: !!PAYSTACK_SECRET_KEY,
      secretKeyPrefix: PAYSTACK_SECRET_KEY ? PAYSTACK_SECRET_KEY.substring(0, 7) : 'NONE',
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

    // Update payment status
    const payment = await prisma.payment.update({
      where: { reference },
      data: {
        status: data.status === 'success' ? 'completed' : 'failed',
        gatewayResponse: data
      }
    });

    // If payment successful, trigger post-payment processing
    if (data.status === 'success') {
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

    res.json({
      success: true,
      data: {
        payment,
        paystack: data
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
        headers: req.headers
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

      // Update payment status
      const payment = await prisma.payment.update({
        where: { reference },
        data: {
          status: 'completed',
          gatewayResponse: event.data
        }
      });

      logger.info('Payment marked completed from webhook', {
        reference,
        paymentId: payment.id
      });

      // Trigger post-payment processing
      try {
        await processSuccessfulPayment(payment.id);
        // NOTE: guest welcome email removed as part of notification cleanup.
        // If this needs an email again later, wire it via notify() and the registry.
      } catch (processingError) {
        logger.error('Webhook post-payment processing failed', {
          errorCode: 'WEBHOOK_PROCESSING_ERROR',
          error: processingError.message
        });
      }
    } else if (event.event === 'subscription.create') {
      const { customer, plan, subscription_code } = event.data;
      logger.info('Subscription created webhook received', { customer: customer.email, plan: plan.name, code: subscription_code });
      
      // Update supporter record status if exists
      const { prisma } = require('../config/db');
      await prisma.supporter.updateMany({
        where: { reference: subscription_code },
        data: { status: 'active' }
      });
    } else if (event.event === 'subscription.disable' || event.event === 'subscription.not_renew') {
      const { subscription_code } = event.data;
      logger.info('Subscription disabled/cancelled webhook received', { code: subscription_code });
      
      const { prisma } = require('../config/db');
      await prisma.supporter.updateMany({
        where: { reference: subscription_code },
        data: { status: 'cancelled' }
      });
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