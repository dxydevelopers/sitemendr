const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const { withTimeout } = require('../utils/promise');
const { convertCurrencyAmount, replaceCurrencyAmountInText } = require('../utils/currency');
const { notify } = require('../services/notify');
const { sendEmail } = require('../config/email');
const { getPhoneChannels, hashToken, hashPhoneCode, requestPhoneCode, checkPhoneCode } = require('../services/accountVerification');

const getAccountExtraFields = async (userId) => {
  const rows = await prisma.$queryRaw`SELECT "phoneVerified", "pendingEmail", "billingAddressLine1", "billingAddressLine2", "billingCity", "billingPostalCode", "billingCountry" FROM "User" WHERE "id" = ${userId} LIMIT 1`;
  return rows[0] || {};
};

const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

const withAccountDefaults = (user) => ({
  ...user,
  country: user?.country || 'US',
  defaultCurrency: user?.defaultCurrency || 'USD',
  accountType: user?.accountType || 'individual',
  billingRegion: user?.billingRegion || user?.country || 'US',
  entityName: user?.entityName || '',
  entityContactEmail: user?.entityContactEmail || '',
  entityPhone: user?.entityPhone || '',
});

const isPrismaUnknownBillingFieldError = (error) => (
  /Unknown argument `(country|defaultCurrency|accountType|billingRegion|entityName|entityContactEmail|entityPhone)`/.test(error?.message || '')
  || /Unknown field `(country|defaultCurrency|accountType|billingRegion|entityName|entityContactEmail|entityPhone)`/.test(error?.message || '')
);

// Send email verification
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const result = await notify('verify-email', {
    to: email,
    verificationUrl,
  });
  if (!result?.sent) {
    throw new Error(`Verification email was not sent (${result?.reason || 'unknown reason'})`);
  }
  return result;
};

// Send password reset email
const sendPasswordResetEmail = async (email, token) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  return notify('reset-password', {
    to: email,
    resetUrl,
  });
};

// Register new user
exports.register = async (req, res) => {
  try {
    const { name, password, phone, country, defaultCurrency, accountType, billingRegion, entityName, entityContactEmail, entityPhone } = req.body;
    const email = req.body.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user in PostgreSQL
    const createData = {
      name: name.trim(),
      email,
      password: hashedPassword,
      phone,
      country: country || 'US',
      defaultCurrency: defaultCurrency || 'USD',
      accountType,
      billingRegion: billingRegion || country || 'US',
      entityName: accountType === 'individual' ? null : entityName.trim(),
      entityContactEmail: accountType === 'individual' || !entityContactEmail ? null : entityContactEmail.toLowerCase(),
      entityPhone: accountType === 'individual' || !entityPhone ? null : entityPhone,
      emailVerificationToken,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      isEmailVerified: false,
      role: 'user',
      banned: false,
    };
    let user;
    try {
      user = await prisma.user.create({ data: createData });
    } catch (createError) {
      if (!isPrismaUnknownBillingFieldError(createError)) throw createError;
      const { country: _country, defaultCurrency: _defaultCurrency, accountType: _accountType, billingRegion: _billingRegion, entityName: _entityName, entityContactEmail: _entityContactEmail, entityPhone: _entityPhone, ...fallbackCreateData } = createData;
      user = await prisma.user.create({ data: fallbackCreateData });
    }
    user = withAccountDefaults(user);

    // Keep the account and verification token even if email delivery is unavailable.
    let verificationEmailSent = false;
    try {
      await sendVerificationEmail(email, emailVerificationToken);
      verificationEmailSent = true;
    } catch (emailError) {
      logger.error('VERIFICATION_EMAIL_SENDING_FAILED:', emailError);
    }

    res.status(201).json({
      success: true,
      message: verificationEmailSent
        ? 'Account created. Check your email to verify your account.'
        : 'Account created, but the verification email could not be sent yet. Try resending it from this screen or sign-in.',
      verificationEmailSent,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country,
        defaultCurrency: user.defaultCurrency,
        accountType: user.accountType,
        billingRegion: user.billingRegion,
        entityName: user.entityName,
        entityContactEmail: user.entityContactEmail,
        entityPhone: user.entityPhone,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    logger.error('REGISTRATION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
      });
    }

    const verifiedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }
    });

    res.json({
      success: true,
      message: 'Email verified successfully',
      token: generateToken(verifiedUser.id),
      user: {
        id: verifiedUser.id,
        name: verifiedUser.name,
        email: verifiedUser.email,
        phone: verifiedUser.phone,
        role: verifiedUser.role,
        country: verifiedUser.country,
        defaultCurrency: verifiedUser.defaultCurrency,
        accountType: verifiedUser.accountType,
        billingRegion: verifiedUser.billingRegion,
        entityName: verifiedUser.entityName,
        entityContactEmail: verifiedUser.entityContactEmail,
        entityPhone: verifiedUser.entityPhone,
        isEmailVerified: verifiedUser.isEmailVerified,
      },
    });
  } catch (error) {
    logger.error('EMAIL_VERIFICATION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
  }
};

// Resend email verification to the authenticated account.
exports.resendVerification = async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, isEmailVerified: true },
      });

      if (user && !user.isEmailVerified) {
        const token = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerificationToken: token,
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          },
        });
        await sendVerificationEmail(user.email, token);
      }
    }

    // Keep the response the same for existing, verified, and unknown emails.
    return res.json({ success: true, message: 'If this account needs verification, a new email has been sent.' });
  } catch (error) {
    logger.error('RESEND_VERIFICATION_ERROR:', error);
    return res.status(500).json({ success: false, message: 'Could not send a verification email. Try again later.' });
  }
};

// Login user
exports.login = async (req, res) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if user is banned
    if (user.banned) {
      return res.status(403).json({
        success: false,
        message: 'Account is banned',
      });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country,
        defaultCurrency: user.defaultCurrency,
        accountType: user.accountType,
        billingRegion: user.billingRegion,
        entityName: user.entityName,
        entityContactEmail: user.entityContactEmail,
        entityPhone: user.entityPhone,
        isEmailVerified: user.isEmailVerified,
        lastLogin: new Date(),
      },
    });
  } catch (error) {
    logger.error('LOGIN_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
};

// Check if user exists
exports.checkUserExistence = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true }
    });

    res.json({
      success: true,
      exists: !!user,
      name: user ? user.name : null
    });
  } catch (error) {
    logger.error('CHECK_USER_EXISTENCE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check user existence'
    });
  }
};

// Get current user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session. Please log in again.',
      });
    }

    const rawUser = await withTimeout(
      prisma.user.findUnique({
        where: { id: userId }
      }),
      5000,
      'Database connection timed out while retrieving profile'
    );
    const user = rawUser ? withAccountDefaults(rawUser) : null;
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    const accountExtra = await getAccountExtraFields(userId);

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country,
        defaultCurrency: user.defaultCurrency,
        accountType: user.accountType,
        billingRegion: user.billingRegion,
        entityName: user.entityName,
        entityContactEmail: user.entityContactEmail,
        entityPhone: user.entityPhone,
        phoneVerified: accountExtra.phoneVerified || false,
        pendingEmail: accountExtra.pendingEmail || '',
        billingAddressLine1: accountExtra.billingAddressLine1 || '',
        billingAddressLine2: accountExtra.billingAddressLine2 || '',
        billingCity: accountExtra.billingCity || '',
        billingPostalCode: accountExtra.billingPostalCode || '',
        billingCountry: accountExtra.billingCountry || user.country,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('GET_PROFILE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid user session. Please log in again.',
      });
    }

    const { name, phone, country, defaultCurrency, accountType, billingRegion, entityName, entityContactEmail, entityPhone,
      billingAddressLine1, billingAddressLine2, billingCity, billingPostalCode, billingCountry } = req.body;

    const currentUser = await prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    if (!currentUser) return res.status(404).json({ success: false, message: 'User not found.' });
    if (phone !== undefined && (phone || '') !== (currentUser.phone || '')) {
      return res.status(409).json({ success: false, message: 'Verify a new phone number before it replaces your current number.' });
    }
    
    const updateData = {
      name: name || undefined,
      phone: undefined,
      country: country || undefined,
      defaultCurrency: defaultCurrency || undefined,
      accountType: accountType || undefined,
      billingRegion: billingRegion || country || undefined,
      entityName: entityName === undefined ? undefined : (entityName || null),
      entityContactEmail: entityContactEmail === undefined ? undefined : (entityContactEmail || null),
      entityPhone: entityPhone === undefined ? undefined : (entityPhone || null),
    };
    let user;
    try {
      user = await prisma.user.update({
        where: { id: userId },
        data: updateData
      });
    } catch (updateError) {
      if (!isPrismaUnknownBillingFieldError(updateError)) throw updateError;
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          name: name || undefined,
          phone: phone || undefined,
        }
      });
    }
    user = withAccountDefaults(user);

    await prisma.$executeRaw`UPDATE "User" SET
      "billingAddressLine1" = ${billingAddressLine1 || null},
      "billingAddressLine2" = ${billingAddressLine2 || null},
      "billingCity" = ${billingCity || null},
      "billingPostalCode" = ${billingPostalCode || null},
      "billingCountry" = ${billingCountry || country || null}
      WHERE "id" = ${userId}`;
    const accountExtra = await getAccountExtraFields(userId);

    let syncedBuildRequests = 0;
    if (defaultCurrency) {
      const openRequests = await prisma.projectRequest.findMany({
        where: {
          userId,
          serviceType: 'build',
          paymentAgreementStatus: { not: 'confirmed' },
          status: { notIn: ['completed', 'cancelled', 'archived'] }
        },
        select: {
          id: true,
          quoteCurrency: true,
          quotedAmount: true,
          depositAmount: true,
          totalAgreedAmount: true,
          paymentInstructions: true
        }
      });

      await Promise.all(openRequests.map((request) => {
        const fromCurrency = request.quoteCurrency || user.defaultCurrency || 'USD';
        const convertedQuotedAmount = request.quotedAmount
          ? convertCurrencyAmount(request.quotedAmount, fromCurrency, defaultCurrency)
          : request.quotedAmount;
        const convertedTotalAgreedAmount = request.totalAgreedAmount
          ? convertCurrencyAmount(request.totalAgreedAmount, fromCurrency, defaultCurrency)
          : request.totalAgreedAmount;
        const convertedDepositAmount = request.depositAmount
          ? convertCurrencyAmount(request.depositAmount, fromCurrency, defaultCurrency)
          : request.depositAmount;
        const dueNow = convertedDepositAmount || convertedTotalAgreedAmount || convertedQuotedAmount;
        const nextInstructions = replaceCurrencyAmountInText(request.paymentInstructions, defaultCurrency, dueNow);
        syncedBuildRequests += 1;
        return prisma.projectRequest.update({
          where: { id: request.id },
          data: {
            quoteCurrency: defaultCurrency,
            quotedAmount: convertedQuotedAmount,
            totalAgreedAmount: convertedTotalAgreedAmount,
            depositAmount: convertedDepositAmount,
            paymentInstructions: nextInstructions
          }
        });
      }));
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        country: user.country,
        defaultCurrency: user.defaultCurrency,
        accountType: user.accountType,
        billingRegion: user.billingRegion,
        entityName: user.entityName,
        entityContactEmail: user.entityContactEmail,
        entityPhone: user.entityPhone,
        phoneVerified: accountExtra.phoneVerified || false,
        pendingEmail: accountExtra.pendingEmail || '',
        billingAddressLine1: accountExtra.billingAddressLine1 || '',
        billingAddressLine2: accountExtra.billingAddressLine2 || '',
        billingCity: accountExtra.billingCity || '',
        billingPostalCode: accountExtra.billingPostalCode || '',
        billingCountry: accountExtra.billingCountry || user.country,
        syncedBuildRequests,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    logger.error('UPDATE_PROFILE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
};

exports.requestEmailChange = async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    const email = req.body.email.trim().toLowerCase();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return res.status(404).json({ success: false, message: 'Account not found.' });
    if (!user.password) {
      return res.status(400).json({ success: false, message: 'This account does not have a password yet. Use the Forgot password link to create one, then try again.' });
    }
    if (!(await bcrypt.compare(req.body.password, user.password))) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
    }
    if (email === user.email.toLowerCase()) return res.status(400).json({ success: false, message: 'Enter a different email address.' });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'That email is already linked to an account.' });
    const pendingRows = await prisma.$queryRaw`SELECT "id" FROM "User" WHERE "pendingEmail" = ${email} AND "id" <> ${userId} LIMIT 1`;
    if (pendingRows.length) return res.status(409).json({ success: false, message: 'That email is already pending confirmation for another account.' });

    const token = crypto.randomBytes(32).toString('hex');
    await prisma.$executeRaw`UPDATE "User" SET "pendingEmail" = ${email}, "emailChangeTokenHash" = ${hashToken(token)}, "emailChangeExpires" = ${new Date(Date.now() + 30 * 60 * 1000)} WHERE "id" = ${userId}`;
    const confirmationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/confirm-email-change?token=${token}`;
    try {
      await sendEmail({
        to: email,
        subject: 'Confirm your new Sitemendr sign-in email',
        html: `<p>Hello ${escapeHtml(user.name)},</p><p>Confirm that you want to use <strong>${escapeHtml(email)}</strong> to sign in to Sitemendr.</p><p><a href="${confirmationUrl}">Confirm email change</a></p><p>This link expires in 30 minutes. Your current email remains active until you confirm.</p>`,
      });
    } catch (mailError) {
      await prisma.$executeRaw`UPDATE "User" SET "pendingEmail" = NULL, "emailChangeTokenHash" = NULL, "emailChangeExpires" = NULL WHERE "id" = ${userId}`;
      throw mailError;
    }
    return res.json({ success: true, message: `Confirmation sent to ${email}. Your sign-in email changes only after confirmation.` });
  } catch (error) {
    logger.error('REQUEST_EMAIL_CHANGE_ERROR:', error);
    if (error.code === 'P2002' || error.meta?.code === '23505') return res.status(409).json({ success: false, message: 'That email is already pending confirmation for another account.' });
    return res.status(500).json({ success: false, message: 'Could not start the email change. Try again later.' });
  }
};

exports.confirmEmailChange = async (req, res) => {
  try {
    const tokenHash = hashToken(req.body.token.trim());
    const rows = await prisma.$queryRaw`UPDATE "User" SET "email" = "pendingEmail", "isEmailVerified" = TRUE, "pendingEmail" = NULL, "emailChangeTokenHash" = NULL, "emailChangeExpires" = NULL, "emailVerificationToken" = NULL, "emailVerificationExpires" = NULL WHERE "emailChangeTokenHash" = ${tokenHash} AND "emailChangeExpires" > NOW() RETURNING "id", "email"`;
    if (!rows[0]) return res.status(400).json({ success: false, message: 'This email confirmation link is invalid or expired.' });
    return res.json({ success: true, message: 'Your sign-in email has been updated.', email: rows[0].email });
  } catch (error) {
    if (error.code === 'P2002' || error.code === '23505' || error.meta?.code === '23505') return res.status(409).json({ success: false, message: 'That email is already linked to another account.' });
    logger.error('CONFIRM_EMAIL_CHANGE_ERROR:', error);
    return res.status(500).json({ success: false, message: 'Could not confirm the email change. Try again later.' });
  }
};

exports.cancelEmailChange = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  await prisma.$executeRaw`UPDATE "User" SET "pendingEmail" = NULL, "emailChangeTokenHash" = NULL, "emailChangeExpires" = NULL WHERE "id" = ${userId}`;
  return res.json({ success: true, message: 'Pending email change cancelled.' });
};

exports.getVerificationMethods = async (_req, res) => res.json({ success: true, email: true, ...getPhoneChannels() });

exports.verifyWhatsAppWebhook = (req, res) => {
  const expectedToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && expectedToken && token === expectedToken && challenge) {
    return res.status(200).type('text/plain').send(String(challenge));
  }
  return res.sendStatus(403);
};

const safeEqualHex = (left, right) => {
  if (typeof left !== 'string' || typeof right !== 'string' || !/^[a-f0-9]+$/i.test(left) || !/^[a-f0-9]+$/i.test(right)) return false;
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
};

const isValidWhatsAppSignature = (req) => {
  const appSecret = process.env.META_APP_SECRET;
  const signature = req.get('x-hub-signature-256') || '';
  if (!appSecret || !req.rawBody || !signature.startsWith('sha256=')) return false;
  const expected = crypto.createHmac('sha256', appSecret).update(req.rawBody).digest('hex');
  return safeEqualHex(signature.slice('sha256='.length), expected);
};

const verifyIncomingWhatsAppCode = async ({ sender, body }) => {
  const senderDigits = String(sender || '').replace(/\D/g, '');
  const match = /^Hi\s+Sitemendr,\s*I['’]m\s+verifying\s+my\s+phone\s+number\.\s*Code:\s*(\d{3})\s+XXX\s+(\d{3})\.?$/i.exec(String(body || '').trim());
  if (!senderDigits || !match) return;
  const code = `${match[1]}${match[2]}`;
  const senderPhone = `+${senderDigits}`;
  const rows = await prisma.$queryRaw`SELECT "id", "pendingPhone", "phoneVerificationCodeHash", "phoneVerificationExpires", "phoneVerificationAttempts" FROM "User" WHERE "pendingPhone" = ${senderPhone} AND "phoneVerificationExpires" > NOW() AND "phoneVerificationAttempts" < 5 LIMIT 1`;
  const pending = rows[0];
  if (!pending?.phoneVerificationCodeHash) return;

  const submittedHash = hashPhoneCode({ userId: pending.id, phone: pending.pendingPhone, code });
  const approved = safeEqualHex(pending.phoneVerificationCodeHash, submittedHash);
  if (!approved) {
    await prisma.$executeRaw`UPDATE "User" SET "phoneVerificationAttempts" = "phoneVerificationAttempts" + 1 WHERE "id" = ${pending.id} AND "pendingPhone" = ${senderPhone} AND "phoneVerificationExpires" > NOW() AND "phoneVerificationAttempts" < 5`;
    return;
  }

  // Clearing the pending challenge in the same update makes webhook retries harmless.
  await prisma.$queryRaw`UPDATE "User" SET "phone" = "pendingPhone", "phoneVerified" = TRUE, "pendingPhone" = NULL, "phoneVerificationCodeHash" = NULL, "phoneVerificationExpires" = NULL, "phoneVerificationAttempts" = 0 WHERE "id" = ${pending.id} AND "pendingPhone" = ${senderPhone} AND "phoneVerificationCodeHash" = ${pending.phoneVerificationCodeHash} AND "phoneVerificationExpires" > NOW() AND "phoneVerificationAttempts" < 5 RETURNING "id"`;
};

exports.receiveWhatsAppWebhook = async (req, res) => {
  if (!isValidWhatsAppSignature(req)) return res.sendStatus(401);
  try {
    const entries = Array.isArray(req.body?.entry) ? req.body.entry : [];
    for (const entry of entries) {
      for (const change of (Array.isArray(entry?.changes) ? entry.changes : [])) {
        if (change?.field !== 'messages') continue;
        const value = change.value || {};
        if (value.metadata?.phone_number_id !== process.env.META_WHATSAPP_PHONE_NUMBER_ID) continue;
        for (const message of (Array.isArray(value.messages) ? value.messages : [])) {
          if (message?.type === 'text') {
            await verifyIncomingWhatsAppCode({ sender: message.from, body: message.text?.body });
          }
        }
      }
    }
    return res.sendStatus(200);
  } catch (error) {
    logger.error('WHATSAPP_VERIFICATION_WEBHOOK_ERROR:', { message: error.message });
    return res.sendStatus(500);
  }
};

exports.getPhoneVerificationStatus = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const rows = await prisma.$queryRaw`SELECT "phone", "phoneVerified", "pendingPhone", "phoneVerificationExpires" FROM "User" WHERE "id" = ${userId} LIMIT 1`;
  const account = rows[0];
  const verified = Boolean(account?.phoneVerified && !account?.pendingPhone);
  return res.json({
    success: true,
    verified,
    phone: verified ? account.phone : null,
    pending: Boolean(account?.pendingPhone),
    expiresAt: account?.phoneVerificationExpires || null,
  });
};

exports.cancelPhoneVerification = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  await prisma.$executeRaw`UPDATE "User" SET "pendingPhone" = NULL, "phoneVerificationCodeHash" = NULL, "phoneVerificationExpires" = NULL, "phoneVerificationAttempts" = 0 WHERE "id" = ${userId}`;
  return res.json({ success: true, message: 'The pending phone verification was cancelled.' });
};

exports.sendPhoneVerificationCode = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const phone = req.body.phone.trim();
  const channel = req.body.channel;
  const channels = getPhoneChannels();
  if (!channels[channel]) return res.status(503).json({ success: false, message: `${channel === 'sms' ? 'SMS' : 'WhatsApp'} verification is not configured yet.` });

  const code = channel === 'whatsapp' ? crypto.randomInt(0, 1_000_000).toString().padStart(6, '0') : null;
  const codeHash = code ? hashPhoneCode({ userId, phone, code }) : null;
  await prisma.$executeRaw`UPDATE "User" SET "pendingPhone" = ${phone}, "phoneVerificationCodeHash" = ${codeHash}, "phoneVerificationExpires" = ${new Date(Date.now() + 10 * 60 * 1000)}, "phoneVerificationAttempts" = 0 WHERE "id" = ${userId}`;
  try {
    const delivery = await requestPhoneCode({ to: phone, channel, code });
    if (channel === 'whatsapp') {
      return res.json({ success: true, message: 'Open the Sitemendr WhatsApp chat and send the prefilled verification message. It expires in 10 minutes.', whatsappLink: delivery.whatsappLink, whatsappWebLink: delivery.whatsappWebLink });
    }
    return res.json({ success: true, message: 'A verification code was sent by SMS. It expires in 10 minutes.' });
  } catch (error) {
    await prisma.$executeRaw`UPDATE "User" SET "pendingPhone" = NULL, "phoneVerificationCodeHash" = NULL, "phoneVerificationExpires" = NULL, "phoneVerificationAttempts" = 0 WHERE "id" = ${userId}`;
    logger.error('PHONE_VERIFICATION_DELIVERY_FAILED:', { channel, message: error.message });
    return res.status(502).json({ success: false, message: 'The verification code could not be delivered. Check the configured channel and number, then try again.' });
  }
};

exports.confirmPhoneVerificationCode = async (req, res) => {
  const userId = req.user?.userId || req.user?.id;
  const rows = await prisma.$queryRaw`SELECT "pendingPhone", "phoneVerificationCodeHash", "phoneVerificationExpires", "phoneVerificationAttempts" FROM "User" WHERE "id" = ${userId} LIMIT 1`;
  const pending = rows[0];
  if (!pending?.pendingPhone || !pending.phoneVerificationExpires || pending.phoneVerificationExpires <= new Date()) {
    return res.status(400).json({ success: false, message: 'Request a new verification code; the previous one is missing or expired.' });
  }
  if (pending.phoneVerificationAttempts >= 5) return res.status(429).json({ success: false, message: 'Too many incorrect codes. Request a new code to continue.' });

  let isApproved = false;
  if (pending.phoneVerificationCodeHash) {
    return res.status(400).json({ success: false, message: 'WhatsApp codes must be sent from the number being verified. Use the Sitemendr WhatsApp link to continue.' });
  }
  try {
    isApproved = await checkPhoneCode({ to: pending.pendingPhone, code: req.body.otp.trim() });
  } catch (error) {
    logger.error('PHONE_VERIFICATION_CHECK_FAILED:', { message: error.message });
    return res.status(502).json({ success: false, message: 'The verification provider is unavailable. Try again shortly.' });
  }
  if (!isApproved) {
    await prisma.$executeRaw`UPDATE "User" SET "phoneVerificationAttempts" = "phoneVerificationAttempts" + 1 WHERE "id" = ${userId}`;
    return res.status(400).json({ success: false, message: 'That code is incorrect. Check it and try again.' });
  }

  const updated = await prisma.$queryRaw`UPDATE "User" SET "phone" = "pendingPhone", "phoneVerified" = TRUE, "pendingPhone" = NULL, "phoneVerificationCodeHash" = NULL, "phoneVerificationExpires" = NULL, "phoneVerificationAttempts" = 0 WHERE "id" = ${userId} RETURNING "phone"`;
  return res.json({ success: true, message: 'Phone number verified and updated.', phone: updated[0]?.phone, phoneVerified: true });
};

// Request password reset
exports.forgotPassword = async (req, res) => {
  try {
    const email = req.body.email?.toLowerCase();
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    const passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpires,
      }
    });

    // Send reset email
    sendPasswordResetEmail(email, resetToken).catch(async (emailError) => {
      logger.error('PASSWORD_RESET_EMAIL_SENDING_FAILED:', emailError);
    });

    res.json({
      success: true,
      message: 'Password reset link sent to your email',
    });
  } catch (error) {
    logger.error('FORGOT_PASSWORD_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password reset request',
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    // Hash the token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      }
    });

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    logger.error('RESET_PASSWORD_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

// Change password (authenticated user)
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId || req.user.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account does not have a password yet. Use the Forgot password link to create one.',
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Choose a password different from your current one.',
      });
    }

    // Check current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
      }
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('CHANGE_PASSWORD_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
    });
  }
};
