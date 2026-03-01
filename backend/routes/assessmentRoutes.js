const express = require('express');
const router = express.Router();
const assessmentController = require('../controllers/assessment');

// Rate limiting middleware (simple implementation)
const rateLimit = (maxRequests, windowMs) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
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

// Assessment routes
router.post('/start', rateLimit(10, 60 * 60 * 1000), assessmentController.startAssessment); // 10 per hour
router.post('/:id/responses', rateLimit(60, 60 * 1000), assessmentController.saveResponses); // 60 per minute
router.post('/:id/process', rateLimit(30, 60 * 1000), assessmentController.processAssessment); // 30 per minute
router.get('/:id/results', rateLimit(30, 60 * 1000), assessmentController.getResults); // 30 per minute
router.post('/:id/lead', rateLimit(10, 60 * 60 * 1000), assessmentController.convertToLead); // 10 per hour

// Admin routes (add authentication middleware in production)
router.get('/stats', assessmentController.getStats);

module.exports = router;