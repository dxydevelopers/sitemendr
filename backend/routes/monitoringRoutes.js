const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const monitoringController = require('../controllers/monitoringController');
const { authenticate } = require('../middleware/auth');
const { checkPaymentStatus, enforcePaymentForAPI } = require('../middleware/paymentEnforcement');

// All monitoring routes require authentication
router.use(authenticate);
router.use(checkPaymentStatus);
router.use(enforcePaymentForAPI);

// Site performance analysis
const performanceScanLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'You have run several scans recently. Please wait before trying again.' }
});
router.post('/analyze', performanceScanLimiter, monitoringController.analyzeSitePerformance);

const availabilityCheckLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'You have checked site availability several times recently. Please wait before trying again.' }
});
router.get('/uptime', availabilityCheckLimiter, monitoringController.checkSiteUptime);

module.exports = router;
