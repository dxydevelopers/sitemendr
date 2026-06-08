const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/auth');
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
  body('name').notEmpty().withMessage('Name is required').trim(),
  validate
];

const loginValidation = [
  body('email').isEmail().withMessage('Enter a valid email address').normalizeEmail(preserveEmailFormat),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

// Public routes (no authentication required)
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
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

// Protected routes (authentication required)
router.use(authenticate);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);
router.post('/change-password', authController.changePassword);

module.exports = router;
