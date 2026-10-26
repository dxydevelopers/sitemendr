const express = require('express');
const router = express.Router();
const clientController = require('../controllers/client');
const supportController = require('../controllers/supportController');
const repairController = require('../controllers/repairController');
const billingDocumentsController = require('../controllers/billingDocumentsController');
const { authenticate } = require('../middleware/auth');
const { checkPaymentStatus, enforcePaymentForAPI } = require('../middleware/paymentEnforcement');

// All client routes require authentication
router.use(authenticate);

// Support and messages must remain reachable so clients can contact the team
// even when payment enforcement pauses site-management features.
router.get('/messages', clientController.getMessages);
router.post('/messages', clientController.sendMessage);
router.post('/messages/:id/replies', clientController.replyToMessage);
router.post('/messages/:id/read', clientController.markMessageRead);
router.put('/messages/:id', clientController.updateMessage);
router.get('/resources', clientController.getResources);
router.get('/support', supportController.getUserTickets);
router.post('/support', supportController.createTicket);

router.use(checkPaymentStatus);

// Discovery routes - allowed even if payment is pending
router.get('/stats', clientController.getDashboardStats);
router.get('/projects', clientController.getProjects);
router.post('/project-requests/:requestId/brief-clarification', clientController.respondToBriefClarification);
router.post('/project-requests/:requestId/quote-response', clientController.respondToProjectQuote);
router.post('/project-requests/:requestId/performance-quote-response', clientController.respondToPerformanceQuote);
router.post('/project-requests/:requestId/performance-review-response', clientController.respondToPerformanceReview);
router.get('/repair/requests', repairController.getClientRepairRequests);
router.post('/repair/requests', repairController.createRepairRequest);
router.post('/repair/requests/:requestId/proposal-response', repairController.respondToRepairProposal);
router.post('/repair/requests/:requestId/review-response', repairController.respondToRepairReview);
router.post('/repair/requests/:requestId/cancellation', repairController.requestRepairCancellation);
router.get('/project-requests/:requestId/conversation', clientController.getProjectConversation);
router.post('/project-requests/:requestId/conversation', clientController.createProjectConversationMessage);
router.post('/project-requests/:requestId/lifecycle-request', clientController.createProjectLifecycleRequest);
router.post('/project-requests/:requestId/staging-review', clientController.respondToStagingReview);
router.get('/project-requests/:requestId/review-chat', clientController.getReviewChatMessages);
router.post('/project-requests/:requestId/review-chat', clientController.createReviewChatMessage);
router.get('/project-requests/:requestId/handoff-chat', clientController.getHandoffChatMessages);
router.post('/project-requests/:requestId/handoff-chat', clientController.createHandoffChatMessage);
router.post('/project-requests/:requestId/handoff-response', clientController.respondToHandoff);
router.get('/assessments', clientController.getAssessments);
router.get('/activities', clientController.getActivities);
router.get('/billing', clientController.getBilling);
router.get('/billing/contract/:id', clientController.getContractBilling);
router.get('/billing/invoices/:id/pdf', billingDocumentsController.invoicePdf);
router.get('/billing/receipts/:id/pdf', billingDocumentsController.receiptPdf);

// Active management routes - require valid payment status
router.use(enforcePaymentForAPI);

router.get('/vitals/:subscriptionId', clientController.getSiteVitals);
router.get('/performance/:subscriptionId/scans', clientController.getPerformanceScans);
router.get('/performance/:subscriptionId/availability', clientController.getSiteAvailabilityHistory);
router.get('/performance/:subscriptionId/requests', clientController.getPerformanceRequests);
router.post('/performance/:subscriptionId/requests', clientController.createPerformanceRequest);
router.get('/domains', clientController.getDomains);
router.post('/domains', clientController.addDomain);
router.patch('/domains/:domainId/site', clientController.moveDomainToSite);
router.post('/domains/:domainId/verify', clientController.verifyDomainDNS);
router.delete('/domains/:domainId', clientController.deleteDomain);
router.post('/optimize-content', clientController.optimizeContent);
router.get('/projects/:subscriptionId/template', clientController.getProjectTemplate);
router.put('/projects/:subscriptionId/template', clientController.updateProjectTemplate);
router.post('/projects/:subscriptionId/request-review', clientController.requestProjectReview);
router.get('/projects/:subscriptionId/milestones', clientController.getProjectMilestones);
router.post('/projects/:subscriptionId/regenerate', clientController.regenerateProjectAI);
router.get('/projects/:subscriptionId/export', clientController.exportProjectCodebase);

module.exports = router;
