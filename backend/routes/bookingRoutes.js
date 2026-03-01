const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/services', bookingController.getAllServices);

// Protected routes
router.use(authenticate);
router.post('/bookings', bookingController.createBooking);
router.get('/my-bookings', bookingController.getUserBookings);

// Admin routes
router.post('/services', requireAdmin, bookingController.createService);
router.put('/services/:id', requireAdmin, bookingController.updateService);
router.delete('/services/:id', requireAdmin, bookingController.deleteService);

module.exports = router;
