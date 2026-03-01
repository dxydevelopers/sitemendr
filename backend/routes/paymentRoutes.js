const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticate, requireAdmin, optionalAuth } = require('../middleware/auth');

// Public webhook endpoint (no authentication needed)
router.post('/webhook', paymentController.handleWebhook);

// Initialize payment (can be guest or authenticated)
router.post('/initialize', optionalAuth, paymentController.initializePayment);

// Protected routes (require authentication)
router.use(authenticate);

// Payment operations
router.get('/verify/:reference', paymentController.verifyPayment);
router.get('/my-payments', paymentController.getUserPayments);
router.get('/:id', paymentController.getPayment);

// Admin routes (require admin role)
router.use(requireAdmin);
router.get('/admin/all', paymentController.getAllPayments);
router.get('/admin/stats', paymentController.getPaymentStats);

module.exports = router;