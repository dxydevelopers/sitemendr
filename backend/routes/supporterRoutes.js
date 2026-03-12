const express = require('express');
const router = express.Router();
const supporterController = require('../controllers/supporterController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public routes (anyone can see tiers)
router.get('/tiers', supporterController.getTiers);

// Protected routes (user must be logged in)
router.use(authenticate);
router.get('/me', supporterController.getMySupporter);
router.post('/subscribe', supporterController.initializeSubscription);

// Admin routes
// router.use(requireAdmin);
// Add admin routes here as needed (e.g., stats)

module.exports = router;
