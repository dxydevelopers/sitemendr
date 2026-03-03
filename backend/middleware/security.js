/**
 * Security middleware for Express
 * Includes headers, sanitization, and protection
 */

const logger = require('../config/logger');

const normalizeOrigin = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\/$/, '');
};

/**
 * Security headers middleware
 * Sets various HTTP security headers
 */
const securityHeaders = (req, res, next) => {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions Policy
  res.setHeader('Permissions-Policy', 
    'camera=(), microphone=(), geolocation=(), payment=()'
  );
  
  // Content Security Policy
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://cdnjs.cloudflare.com",
      "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' https://fonts.gstatic.com data:",
      "connect-src 'self' https: wss:",
      "frame-src 'self' https://www.youtube.com https://player.vimeo.com",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ')
  );
  
  // Strict Transport Security (only in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  next();
};

/**
 * Input sanitization middleware
 * Sanitizes user input to prevent injection attacks
 */
const sanitizeInput = (req, res, next) => {
  // Helper to sanitize a value
  const sanitize = (value) => {
    if (typeof value === 'string') {
      // Remove null bytes
      let sanitized = value.replace(/\0/g, '');
      
      // Trim whitespace
      sanitized = sanitized.trim();
      
      return sanitized;
    }
    
    if (Array.isArray(value)) {
      return value.map(sanitize);
    }
    
    if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const [key, val] of Object.entries(value)) {
        sanitized[key] = sanitize(val);
      }
      return sanitized;
    }
    
    return value;
  };
  
  // Sanitize body
  if (req.body) {
    req.body = sanitize(req.body);
  }
  
  // Sanitize query params
  if (req.query) {
    req.query = sanitize(req.query);
  }
  
  // Sanitize params
  if (req.params) {
    req.params = sanitize(req.params);
  }
  
  next();
};

/**
 * Request size limiter
 * Prevents large payload attacks
 */
const requestSizeLimiter = (maxSize = '1mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    const maxBytes = parseSize(maxSize);
    
    if (contentLength > maxBytes) {
      logger.warn(`Request too large: ${contentLength} bytes`, {
        path: req.path,
        ip: req.ip
      });
      
      return res.status(413).json({
        success: false,
        message: 'Request payload too large'
      });
    }
    
    next();
  };
};

/**
 * Parse size string to bytes
 */
const parseSize = (size) => {
  const units = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 };
  const match = size.match(/^(\d+)([KMG]?B)$/i);
  
  if (!match) return 1024 * 1024; // Default 1MB
  
  const value = parseInt(match[1]);
  const unit = match[2].toUpperCase();
  
  return value * units[unit];
};

/**
 * Advanced rate limiting with IP tracking
 */
const advancedRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 100,
    message = 'Too many requests'
  } = options;
  
  // Store request counts in memory
  // In production, use Redis
  const requestCounts = new Map();
  
  // Cleanup old entries periodically
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of requestCounts.entries()) {
      if (now - value.resetTime > windowMs) {
        requestCounts.delete(key);
      }
    }
  }, windowMs);
  
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    
    let record = requestCounts.get(key);
    
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs
      };
      requestCounts.set(key, record);
    }
    
    record.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - record.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));
    
    if (record.count > max) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`, { path: req.path });
      
      return res.status(429).json({
        success: false,
        message,
        retryAfter: Math.ceil((record.resetTime - now) / 1000)
      });
    }
    
    next();
  };
};

/**
 * SQL injection prevention helper
 * Validates and sanitizes database inputs
 */
const preventSQLInjection = (req, res, next) => {
  // Common SQL injection patterns
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|TRUNCATE)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b.*=.*\bOR\b)/i,
    /(\bAND\b.*=.*\bAND\b)/i,
    /(['"]?:\s*OR\s*['"]?\d)/i,
  ];
  
  const checkValue = (value, path) => {
    if (typeof value === 'string') {
      for (const pattern of sqlPatterns) {
        if (pattern.test(value)) {
          logger.warn('Potential SQL injection detected', {
            path,
            value: value.substring(0, 50),
            ip: req.ip
          });
          return false;
        }
      }
    }
    return true;
  };
  
  const traverse = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return true;
    
    for (const [key, val] of Object.entries(obj)) {
      const currentPath = `${path}.${key}`;
      
      if (typeof val === 'string') {
        if (!checkValue(val, currentPath)) return false;
      } else if (Array.isArray(val)) {
        for (let i = 0; i < val.length; i++) {
          if (!checkValue(val[i], `${currentPath}[${i}]`)) return false;
        }
      } else if (typeof val === 'object') {
        if (!traverse(val, currentPath)) return false;
      }
    }
    return true;
  };
  
  if (!traverse(req.body) || !traverse(req.query)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input detected'
    });
  }
  
  next();
};

/**
 * CORS configuration
 */
const corsOptions = (req, res, next) => {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.FRONTEND_URL
  ]
    .filter(Boolean)
    .map(normalizeOrigin);
  
  const origin = req.headers.origin;
  const normalizedOrigin = normalizeOrigin(origin);
  
  if (allowedOrigins.includes(normalizedOrigin) || !origin) {
    const headerOrigin = origin || allowedOrigins[0];
    if (headerOrigin) {
      res.setHeader('Access-Control-Allow-Origin', headerOrigin);
    }
  } else {
    logger.warn(`CORS blocked request from: ${origin}`);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  
  next();
};

module.exports = {
  securityHeaders,
  sanitizeInput,
  requestSizeLimiter,
  advancedRateLimit,
  preventSQLInjection,
  corsOptions
};
