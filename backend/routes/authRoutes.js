const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
const oauthController = require('../controllers/oauth');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validator');

// Validation rules
const preserveEmailFormat = {
  gmail_remove_dots: false,
  gmail_remove_subaddress: false,
  outlookdotcom_remove_subaddress: false,
  yahoo_remove_subaddress: false,
  icloud_remove_subaddress: false
};

const registerValidation = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Enter your name (2 to 120 characters)'),
  body('accountType').isIn(['individual', 'business', 'organization', 'agency']).withMessage('Choose a valid client type'),
  body('entityName').if(body('accountType').exists().not().equals('individual')).trim().isLength({ min: 2, max: 160 }).withMessage('Enter the business, organisation, or agency name'),
  body('entityContactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid entity contact email').normalizeEmail(preserveEmailFormat),
  body('entityPhone').optional({ checkFalsy: true }).trim().matches(/^\+?[0-9\s().-]{8,32}$/).withMessage('Enter a valid entity phone number'),
  body('phone').optional({ checkFalsy: true }).trim().matches(/^\+?[0-9\s().-]{8,32}$/).withMessage('Enter a valid phone number'),
  body('country').optional().isISO31661Alpha2().withMessage('Choose a valid country'),
  body('defaultCurrency').optional().matches(/^[A-Za-z]{3}$/).withMessage('Choose a valid currency'),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

const profileValidation = [
  body('accountType').optional().isIn(['individual', 'business', 'organization', 'agency']).withMessage('Choose a valid client type'),
  body('entityName').if(body('accountType').exists().not().equals('individual')).trim().isLength({ min: 2, max: 160 }).withMessage('Enter the business, organisation, or agency name'),
  body('entityName').optional({ checkFalsy: true }).trim().isLength({ min: 2, max: 160 }).withMessage('Enter a valid entity name'),
  body('entityContactEmail').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid entity contact email').normalizeEmail(preserveEmailFormat),
  body('entityPhone').optional({ checkFalsy: true }).trim().matches(/^\+?[0-9\s().-]{8,32}$/).withMessage('Enter a valid entity phone number'),
  body('phone').optional({ checkFalsy: true }).trim().matches(/^\+?[0-9\s().-]{8,32}$/).withMessage('Enter a valid phone number'),
  body('country').optional().isISO31661Alpha2().withMessage('Choose a valid country'),
  body('defaultCurrency').optional().matches(/^[A-Za-z]{3}$/).withMessage('Choose a valid currency'),
  body('billingAddressLine1').optional({ checkFalsy: true }).trim().isLength({ max: 180 }).withMessage('Billing address is too long'),
  body('billingAddressLine2').optional({ checkFalsy: true }).trim().isLength({ max: 180 }).withMessage('Billing address is too long'),
  body('billingCity').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).withMessage('Enter a valid billing city'),
  body('billingPostalCode').optional({ checkFalsy: true }).trim().isLength({ max: 24 }).withMessage('Enter a valid postal code'),
  body('billingCountry').optional().isISO31661Alpha2().withMessage('Choose a valid billing country'),
  validate,
];

// Public routes (no authentication required)
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.get('/oauth/providers', oauthController.getProviders);
router.get('/oauth/:provider', oauthController.start);
router.get('/oauth/:provider/callback', oauthController.callback);
router.post('/oauth/apple/callback', oauthController.callback);
router.post('/resend-verification', rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many verification emails requested. Try again later.' },
}), [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  validate,
], authController.resendVerification);
router.post('/check-user', [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  validate
], authController.checkUserExistence);
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  validate
], authController.forgotPassword);
router.post('/reset-password', [
  body('token').notEmpty().withMessage('Token is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
  validate
], authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/confirm-email-change', [
  body('token').isLength({ min: 32, max: 128 }).withMessage('Invalid confirmation token'),
  validate,
], authController.confirmEmailChange);
// Meta verifies this public callback with GET and delivers incoming WhatsApp messages with POST.
router.get('/whatsapp/webhook', authController.verifyWhatsAppWebhook);
router.post('/whatsapp/webhook', authController.receiveWhatsAppWebhook);

// Protected routes (authentication required)
router.use(authenticate);
router.get('/profile', authController.getProfile);
router.put('/profile', profileValidation, authController.updateProfile);
router.post('/change-password', [
  body('currentPassword').notEmpty().withMessage('Enter your current password'),
  body('newPassword').isLength({ min: 8 }).withMessage('Your new password must be at least 8 characters long'),
  validate,
], authController.changePassword);
router.post('/request-email-change', [
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false }),
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  body('password').notEmpty().withMessage('Enter your current password'),
  validate,
], authController.requestEmailChange);
router.post('/cancel-email-change', authController.cancelEmailChange);
router.get('/verification-methods', authController.getVerificationMethods);
router.get('/phone-verification-status', authController.getPhoneVerificationStatus);
router.post('/cancel-phone-verification', authController.cancelPhoneVerification);
router.post('/send-phone-otp', [
  rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false }),
  body('phone').trim().matches(/^\+[1-9]\d{7,14}$/).withMessage('Enter the new phone in international format, such as +254712345678'),
  body('channel').isIn(['sms', 'whatsapp']).withMessage('Choose SMS or WhatsApp verification'),
  validate,
], authController.sendPhoneVerificationCode);
router.post('/verify-phone-otp', [
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: true, legacyHeaders: false }),
  body('otp').trim().matches(/^\d{6}$/).withMessage('Enter the six digit verification code'),
  validate,
], authController.confirmPhoneVerificationCode);

module.exports = router;
