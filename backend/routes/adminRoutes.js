const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin');
const blogController = require('../controllers/blogController');
const analyticsController = require('../controllers/analyticsController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validator');
const logger = require('../config/logger');

// All admin routes require authentication and admin role
router.use((req, res, next) => {
  logger.info(`Admin route accessed: ${req.method} ${req.path}`);
  next();
});
router.use(authenticate);
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard/stats', adminController.getAdminStats);

// Lead management
router.get('/leads', adminController.getLeads);
router.get('/leads/:id', adminController.getLead);
router.put('/leads/:id/status', [
  body('status').notEmpty().withMessage('Status is required'),
  validate
], adminController.updateLeadStatus);
router.delete('/leads/:id', adminController.deleteLead);

// User management
router.delete('/users/:id', adminController.deleteUser);
router.get('/users', adminController.getUsers);
router.put('/users/:id/role', [
  body('role').isIn(['user', 'admin', 'client']).withMessage('Invalid role'),
  validate
], adminController.updateUserRole);
router.put('/users/:id/ban', adminController.toggleUserBan);

// Assessment overview
router.get('/assessments', adminController.getAssessments);
router.delete('/assessments/:id', adminController.deleteAssessment);

// Support tickets
router.get('/support', adminController.getAllSupportTickets);
router.get('/support/:id', adminController.getSupportTicket);
router.put('/support/:id', adminController.updateSupportTicket);
router.post('/support/:id/messages', [
  body('content').notEmpty().withMessage('Message content is required'),
  validate
], adminController.addSupportTicketMessage);

// Subscription & Template management
router.get('/subscriptions', adminController.getSubscriptions);
router.delete('/subscriptions/:id', adminController.deleteSubscription);
router.post('/subscriptions/:id/generate', adminController.triggerAIGeneration);
router.get('/subscriptions/:id/template', adminController.getTemplate);
router.put('/subscriptions/:id/template', [
  body('html').notEmpty().withMessage('HTML content is required'),
  validate
], adminController.updateTemplate);
router.post('/subscriptions/:id/deploy', adminController.deployTemplate);
router.put('/subscriptions/:id/review', adminController.updateSubscriptionReview);

// Milestone management
router.get('/milestones/:subscriptionId', adminController.getSubscriptionMilestones);
router.post('/milestones', [
  body('subscriptionId').notEmpty().withMessage('Subscription ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  validate
], adminController.createMilestone);
router.put('/milestones/:id', adminController.updateMilestone);
router.delete('/milestones/:id', adminController.deleteMilestone);

// Enforcement Settings
router.get('/settings/enforcement', adminController.getEnforcementSettings);
router.put('/settings/enforcement', adminController.updateEnforcementSettings);

// Automation triggers
router.post('/automation/suspension-check', adminController.runSuspensionCheck);
router.post('/automation/dns-verify', adminController.runDNSVerification);
router.post('/security/scan', adminController.runSecurityScan);

// Blog management
router.get('/blog', blogController.getAllPosts);
router.post('/blog', blogController.createPost);
router.put('/blog/:id', blogController.updatePost);
router.delete('/blog/:id', blogController.deletePost);

// Analytics
router.get('/analytics', analyticsController.getDashboardAnalytics);
router.get('/analytics/export', analyticsController.exportAnalytics);

// System & Moderation
router.get('/system/health', adminController.getSystemHealth);
router.get('/comments', adminController.getComments);
router.put('/comments/:id/status', adminController.updateCommentStatus);
router.delete('/comments/:id', adminController.deleteComment);

// Booking Management
router.get('/bookings', adminController.getAdminBookings);
router.put('/bookings/:id/status', adminController.updateBookingStatus);
router.delete('/bookings/:id', adminController.deleteBooking);

module.exports = router;


