const { prisma } = require('../config/db');
const logger = require('../config/logger');
const discountService = require('../services/discountService');

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    const where = { isActive: true };
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }
    const products = await prisma.product.findMany({
      where,
    });
    res.json(products);
  } catch (error) {
    logger.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    logger.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
};

// Create product (Admin only)
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock, subscriptionId } = req.body;
    const product = await prisma.product.create({
      data: { name, description, price: parseFloat(price), image, category, stock: parseInt(stock), subscriptionId },
    });
    res.status(201).json(product);
  } catch (error) {
    logger.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
};

// Update product (Admin only)
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, image, category, stock, isActive } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { 
        name, 
        description, 
        price: price ? parseFloat(price) : undefined, 
        image, 
        category, 
        stock: stock ? parseInt(stock) : undefined,
        isActive
      },
    });
    res.json(product);
  } catch (error) {
    logger.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
};

// Delete product (Admin only)
exports.deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    logger.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
};

// Create order
exports.createOrder = async (req, res) => {
  try {
    const { items, subscriptionId, discountCode } = req.body; // items: [{ productId, quantity }]
    const userId = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    // Calculate total and fetch product prices
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product ${product.name}` });
      }

      totalAmount += product.price * item.quantity;
      orderItemsData.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Apply discount code if provided
    let appliedDiscountCode = null;
    let discountAmount = 0;
    
    if (discountCode) {
      const validation = await discountService.validateDiscountCode(discountCode, userId, totalAmount);
      if (!validation.valid) {
        return res.status(400).json({ message: validation.message });
      }
      
      appliedDiscountCode = validation.discountCode;
      discountAmount = discountService.calculateDiscount(appliedDiscountCode, totalAmount);
      totalAmount = Math.max(0, totalAmount - discountAmount);
    }

    // Create order and update stock in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          subscriptionId,
          totalAmount,
          discountCodeId: appliedDiscountCode?.id,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // Update discount code usage
      if (appliedDiscountCode) {
        await tx.discountCode.update({
          where: { id: appliedDiscountCode.id },
          data: { currentUses: { increment: 1 } }
        });
      }

      // Update stock
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (error) {
    logger.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
};

// Get user orders
exports.getUserOrders = async (req, res) => {
  try {
    const { subscriptionId } = req.query;
    const where = { userId: req.user.id };
    if (subscriptionId) {
      where.subscriptionId = subscriptionId;
    }
    const orders = await prisma.order.findMany({
      where,
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching user orders:', error);
    res.status(500).json({ message: 'Error fetching user orders' });
  }
};
