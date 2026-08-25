const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const notificationRulesController = require('../controllers/notificationRulesController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const logger = require('../config/logger');

router.use((req, res, next) => {
  logger.info(`Notification rules route accessed: ${req.method} ${req.path}`);
  next();
});
router.use(authenticate);
router.use(requireAdmin);

// Specific routes before /:id so Express doesn't parse these as ids
router.get('/categories', notificationRulesController.getCategories);
router.get('/email-config', notificationRulesController.getEmailConfig);
router.patch('/email-config', [
  body('transport').notEmpty().withMessage('Transport is required'),
  validate
], notificationRulesController.updateEmailConfig);

// Notification rules
router.get('/', notificationRulesController.getNotificationRules);
router.post('/', [
  body('name').notEmpty().withMessage('Name is required'),
  body('category').notEmpty().withMessage('Category is required'),
  body('trigger').notEmpty().withMessage('Trigger description is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('htmlTemplate').notEmpty().withMessage('Body is required'),
  validate
], notificationRulesController.createNotificationRule);

router.get('/:id', notificationRulesController.getNotificationRule);
router.patch('/:id', notificationRulesController.updateNotificationRule);
router.delete('/:id', notificationRulesController.deleteNotificationRule);

module.exports = router;