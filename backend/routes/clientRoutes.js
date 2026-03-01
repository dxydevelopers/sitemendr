const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client');
const { authenticate } = require('../middleware/auth');
const { checkPaymentStatus, enforcePaymentForAPI } = require('../middleware/paymentEnforcement');

// All client routes require authentication
router.use(authenticate);
router.use(checkPaymentStatus);
router.use(enforcePaymentForAPI);

router.get('/stats', clientController.getDashboardStats);
router.get('/vitals/:subscriptionId', clientController.getSiteVitals);
router.get('/projects', clientController.getProjects);
router.get('/activities', clientController.getActivities);
router.get('/billing', clientController.getBilling);
router.get('/messages', clientController.getMessages);
router.post('/messages', clientController.sendMessage);
router.get('/resources', clientController.getResources);
router.get('/support', clientController.getSupportTickets);
router.post('/support', clientController.createSupportTicket);
router.get('/domains', clientController.getDomains);
router.post('/domains', clientController.addDomain);
router.post('/domains/:domainId/verify', clientController.verifyDomainDNS);
router.post('/optimize-content', clientController.optimizeContent);
router.get('/projects/:subscriptionId/template', clientController.getProjectTemplate);
router.put('/projects/:subscriptionId/template', clientController.updateProjectTemplate);
router.post('/projects/:subscriptionId/request-review', clientController.requestProjectReview);
router.get('/projects/:subscriptionId/milestones', clientController.getProjectMilestones);
router.post('/projects/:subscriptionId/regenerate', clientController.regenerateProjectAI);
router.get('/projects/:subscriptionId/export', clientController.exportProjectCodebase);

module.exports = router;
