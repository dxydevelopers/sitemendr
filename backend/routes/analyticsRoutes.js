const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

// Dashboard analytics
router.get('/dashboard', analyticsController.getDashboardAnalytics);

// Export analytics
router.get('/export', analyticsController.exportAnalytics);

module.exports = router;
