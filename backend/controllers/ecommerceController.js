const { prisma } = require('../config/db');
const logger = require('../config/logger');
const discountService = require('../services/discountService');

const COMMERCE_ADDON_ID = 'addon_ecommerce_lite';

const hasCommerceAddon = (purchasedAddons) => Array.isArray(purchasedAddons)
  && purchasedAddons.some((addon) => addon === COMMERCE_ADDON_ID || addon?.id === COMMERCE_ADDON_ID);

const isAdmin = (req) => req.user?.role === 'admin' || req.admin?.role === 'admin';

async function getManageableSite(req, subscriptionId) {
  if (!subscriptionId) return null;
  const where = { id: subscriptionId, status: 'active', suspended: false };
  if (!isAdmin(req)) where.userId = req.user?.userId || req.user?.id;
  const site = await prisma.subscription.findFirst({ where });
  if (!site || (!isAdmin(req) && !hasCommerceAddon(site.purchasedAddons))) return null;
  return site;
}

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
    const site = await getManageableSite(req, subscriptionId);
    if (!site) return res.status(403).json({ message: 'An active site with E-commerce Core is required to manage products.' });
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (!name?.trim() || !description?.trim() || !Number.isFinite(parsedPrice) || parsedPrice < 0 || !Number.isInteger(parsedStock) || parsedStock < 0) {
      return res.status(400).json({ message: 'Provide a name, description, valid price, and non-negative whole-number stock.' });
    }
    const product = await prisma.product.create({
      data: { name: name.trim(), description: description.trim(), price: parsedPrice, image, category, stock: parsedStock, subscriptionId: site.id },
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
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing?.subscriptionId) return res.status(404).json({ message: 'Product not found for this site.' });
    const site = await getManageableSite(req, existing.subscriptionId);
    if (!site) return res.status(403).json({ message: 'You cannot manage products for this site.' });
    const data = {
      name: typeof name === 'string' ? name.trim() : undefined,
      description: typeof description === 'string' ? description.trim() : undefined,
      price: price === undefined ? undefined : Number(price),
      image,
      category,
      stock: stock === undefined ? undefined : Number(stock),
      isActive: typeof isActive === 'boolean' ? isActive : undefined,
    };
    if (data.name !== undefined && !data.name) return res.status(400).json({ message: 'Product name cannot be empty.' });
    if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0)) return res.status(400).json({ message: 'Provide a valid non-negative price.' });
    if (data.stock !== undefined && (!Number.isInteger(data.stock) || data.stock < 0)) return res.status(400).json({ message: 'Stock must be a non-negative whole number.' });
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
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
    const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!existing?.subscriptionId) return res.status(404).json({ message: 'Product not found for this site.' });
    const site = await getManageableSite(req, existing.subscriptionId);
    if (!site) return res.status(403).json({ message: 'You cannot manage products for this site.' });
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
    const userId = req.user.userId || req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items provided' });
    }

    const site = subscriptionId ? await prisma.subscription.findFirst({ where: { id: subscriptionId, status: 'active', suspended: false } }) : null;
    if (!site || (!isAdmin(req) && (!hasCommerceAddon(site.purchasedAddons) || site.userId !== userId))) {
      return res.status(403).json({ message: 'An active store with E-commerce Core is required to place an order.' });
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

      if (product.subscriptionId !== site.id || !product.isActive || !Number.isInteger(item.quantity) || item.quantity < 1) {
        return res.status(400).json({ message: 'Order items must be active products from the selected store with valid quantities.' });
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
    const where = { userId: req.user.userId || req.user.id };
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
