const express = require('express');
const router = express.Router();
const supportController = require('../controllers/supportController');
const { authenticate, optionalAuth } = require('../middleware/auth');

// AI Chat
router.post('/chat', supportController.chatWithSupport);
router.post('/live-chat/session', optionalAuth, supportController.createLiveChatSession);

// All other support routes require authentication
router.use(authenticate);

// Support tickets
router.post('/tickets', supportController.createTicket);
router.get('/tickets', supportController.getUserTickets);
router.get('/tickets/:id', supportController.getTicketDetails);
router.post('/tickets/:id/messages', supportController.addMessage);
router.post('/tickets/:id/read', supportController.markTicketRead);

module.exports = router;
