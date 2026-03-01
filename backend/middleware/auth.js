const jwt = require('jsonwebtoken');
const { prisma } = require('../config/db');
const logger = require('../config/logger');

// Middleware to authenticate JWT tokens
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Normalize userId
      decoded.userId = decoded.userId || decoded.id;
      
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
      });
    }
  } catch (error) {
    logger.error('AUTH_MIDDLEWARE_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};

// Middleware to check if user is admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    req.admin = user;
    next();
  } catch (error) {
    logger.error('ADMIN_CHECK_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

// Middleware to check if user is admin or manager
const requireManager = async (req, res, next) => {
  try {
    const userId = req.user?.userId || req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!['admin', 'manager'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Manager or Admin role required.',
      });
    }

    req.manager = user;
    next();
  } catch (error) {
    logger.error('MANAGER_CHECK_ERROR:', error);
    res.status(500).json({
      success: false,
      message: 'Authorization check failed',
    });
  }
};

// Optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Normalize userId
        decoded.userId = decoded.userId || decoded.id;
        
        req.user = decoded;
      } catch (error) {
        // Token invalid but don't fail - just continue without user
        logger.info('Optional auth token invalid:', { message: error.message });
      }
    }

    next();
  } catch (error) {
    logger.error('OPTIONAL_AUTH_ERROR:', error);
    next(); // Continue even if error
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireManager,
  optionalAuth,
};
