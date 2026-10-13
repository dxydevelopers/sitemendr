const express = require('express');
const router = express.Router();
const ecommerceController = require('../controllers/ecommerceController');
const { authenticate } = require('../middleware/auth');

// Public routes
router.get('/products', ecommerceController.getAllProducts);
router.get('/products/:id', ecommerceController.getProductById);

// Protected routes
router.use(authenticate);
router.post('/orders', ecommerceController.createOrder);
router.get('/my-orders', ecommerceController.getUserOrders);

// Product management is scoped to owned sites with the E-commerce Core add-on.
router.post('/products', ecommerceController.createProduct);
router.put('/products/:id', ecommerceController.updateProduct);
router.delete('/products/:id', ecommerceController.deleteProduct);

module.exports = router;
