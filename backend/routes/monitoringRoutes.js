const express = require('express');
const router = express.Router();
const monitoringController = require('../controllers/monitoringController');
const { authenticate } = require('../middleware/auth');
const { checkPaymentStatus, enforcePaymentForAPI } = require('../middleware/paymentEnforcement');

// All monitoring routes require authentication
router.use(authenticate);
router.use(checkPaymentStatus);
router.use(enforcePaymentForAPI);

// Site performance analysis
router.post('/analyze', monitoringController.analyzeSitePerformance);

// Uptime check
router.get('/uptime', monitoringController.checkSiteUptime);

module.exports = router;
