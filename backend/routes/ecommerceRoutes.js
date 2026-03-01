const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/products', ecommerceController.getAllProducts);
router.get('/products/:id', ecommerceController.getProductById);

// Protected routes
router.use(authenticate);
router.post('/orders', ecommerceController.createOrder);
router.get('/my-orders', ecommerceController.getUserOrders);

// Admin routes
router.post('/products', requireAdmin, ecommerceController.createProduct);
router.put('/products/:id', requireAdmin, ecommerceController.updateProduct);
router.delete('/products/:id', requireAdmin, ecommerceController.deleteProduct);

module.exports = router;
