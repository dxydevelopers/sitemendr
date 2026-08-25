const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const logger = require('../config/logger');
const { withTimeout } = require('../utils/promise');
const { convertCurrencyAmount, replaceCurrencyAmountInText } = require('../utils/currency');
const { notify } = require('../services/notify');

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
  billingRegion: user?.billingRegion || user?.country || 'US'
});

const isPrismaUnknownBillingFieldError = (error) => (
  /Unknown argument `(country|defaultCurrency|accountType|billingRegion)`/.test(error?.message || '')
  || /Unknown field `(country|defaultCurrency|accountType|billingRegion)`/.test(error?.message || '')
);

// Send email verification
const sendVerificationEmail = async (email, token) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  return notify('verify-email', {
    to: email,
    verificationUrl,
  });
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
    const { name, password, phone, country, defaultCurrency, accountType, billingRegion } = req.body;
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
      name,
      email,
      password: hashedPassword,
      phone,
      country: country || 'US',
      defaultCurrency: defaultCurrency || 'USD',
      accountType: accountType || 'individual',
      billingRegion: billingRegion || country || 'US',
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
      const { country: _country, defaultCurrency: _defaultCurrency, accountType: _accountType, billingRegion: _billingRegion, ...fallbackCreateData } = createData;
      user = await prisma.user.create({ data: fallbackCreateData });
    }
    user = withAccountDefaults(user);

    // Send verification email
    sendVerificationEmail(email, emailVerificationToken).catch(emailError => {
      logger.error('VERIFICATION_EMAIL_SENDING_FAILED:', emailError);
    });

    // Generate token for immediate login
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please check your email to verify your account.',
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

    await prisma.user.update({
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
    });
  } catch (error) {
    logger.error('EMAIL_VERIFICATION_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Email verification failed',
    });
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

    const { name, phone, country, defaultCurrency, accountType, billingRegion } = req.body;
    
    const updateData = {
      name: name || undefined,
      phone: phone || undefined,
      country: country || undefined,
      defaultCurrency: defaultCurrency || undefined,
      accountType: accountType || undefined,
      billingRegion: billingRegion || country || undefined,
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