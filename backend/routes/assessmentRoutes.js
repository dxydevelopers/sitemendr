const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment');
const { optionalAuth } = require('../middleware/auth');

// Rate limiting middleware (simple implementation)
const rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.user?.userId || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    // Remove old requests
    const validRequests = userRequests.filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later'
      });
    }

    validRequests.push(now);
    requests.set(key, validRequests);

    next();
  };
};

const assessmentStartRateLimit = (() => {
  const requests = new Map();
  const windowMs = 60 * 60 * 1000;

  return (req, res, next) => {
    const source = req.body?.source;
    const isDashboardBuildRequest = source === 'dashboard_build' || req.body?.referrer === 'dashboard_build';
    const isDashboardBuild = isDashboardBuildRequest && req.user?.userId;
    const maxRequests = isDashboardBuild ? 120 : 10;
    const key = `${req.user?.userId || req.ip}:${isDashboardBuildRequest ? 'dashboard_build' : (source || 'direct')}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const validRequests = requests.get(key).filter(time => time > windowStart);

    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: isDashboardBuild
          ? 'Too many build brief starts. Please wait a moment and try again.'
          : 'Too many requests, please try again later'
      });
    }

    validRequests.push(now);
    requests.set(key, validRequests);

    next();
  };
})();

// Assessment routes
router.post('/start', optionalAuth, assessmentStartRateLimit, assessmentController.startAssessment);
router.post('/:id/responses', optionalAuth, rateLimit(60, 60 * 1000), assessmentController.saveResponses); // 60 per minute
router.post('/:id/process', optionalAuth, rateLimit(30, 60 * 1000), assessmentController.processAssessment); // 30 per minute
router.get('/:id/details', optionalAuth, rateLimit(30, 60 * 1000), assessmentController.getDetails); // 30 per minute
router.get('/:id/results', rateLimit(30, 60 * 1000), assessmentController.getResults); // 30 per minute
router.post('/:id/lead', rateLimit(10, 60 * 60 * 1000), assessmentController.convertToLead); // 10 per hour

// Admin routes (add authentication middleware in production)
router.get('/stats', assessmentController.getStats);

module.exports = router;
