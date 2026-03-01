const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { checkPaymentStatus, enforcePaymentForAPI } = require('../middleware/paymentEnforcement');

// All routes require authentication
router.use(authenticate);

// User subscription routes
router.use(checkPaymentStatus);
router.get('/my-subscription', subscriptionController.getUserSubscription);
router.post('/create-or-update', subscriptionController.createOrUpdateSubscription);
router.post('/process-payment-success', subscriptionController.processPaymentSuccess);
router.post('/deploy', subscriptionController.deploySubscription);
router.post('/:subscriptionId/reactivate', subscriptionController.reactivateSubscription);
router.post('/:subscriptionId/generate-template', subscriptionController.generateSubscriptionTemplate);

// Admin routes
router.use(requireAdmin);
router.get('/admin/all', subscriptionController.getAllSubscriptions);
router.post('/admin/suspend', subscriptionController.suspendSubscription);

module.exports = router;