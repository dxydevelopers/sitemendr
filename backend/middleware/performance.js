/**
 * Performance optimization middleware for Express
 * Includes caching, compression, and response optimization
 */

const logger = require('../config/logger');

// In-memory cache (for simple caching)
// In production, use Redis
const memoryCache = new Map();

/**
 * Simple in-memory cache with TTL
 */
const cache = {
  get(key) {
    const item = memoryCache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      memoryCache.delete(key);
      return null;
    }
    
    return item.value;
  },
  
  set(key, value, ttlSeconds = 300) {
    memoryCache.set(key, {
      value,
      expiry: Date.now() + (ttlSeconds * 1000)
    });
  },
  
  delete(key) {
    memoryCache.delete(key);
  },
  
  clear() {
    memoryCache.clear();
  }
};

/**
 * Cache middleware for GET requests
 * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
 */
const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }
    
    const cacheKey = req.originalUrl || req.url;
    
    // Check cache
    const cachedResponse = cache.get(cacheKey);
    if (cachedResponse) {
      logger.debug(`Cache hit: ${cacheKey}`);
      return res.status(200).json(cachedResponse);
    }
    
    // Override res.json to capture response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode === 200 && data) {
        cache.set(cacheKey, data, ttlSeconds);
        logger.debug(`Cached: ${cacheKey}`);
      }
      return originalJson(data);
    };
    
    next();
  };
};

/**
 * Cache invalidation helper
 */
const invalidateCache = (pattern) => {
  let count = 0;
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
      count++;
    }
  }
  logger.info(`Invalidated ${count} cache entries for pattern: ${pattern}`);
  return count;
};

/**
 * Response time header middleware
 */
const responseTime = (req, res, next) => {
  const start = process.hrtime.bigint();

  const writeResponseTimeHeader = () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${durationMs.toFixed(1)}ms`);
    }
    return durationMs;
  };

  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    writeResponseTimeHeader();
    return originalWriteHead.apply(this, args);
  };

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    // Log slow requests (> 1 second)
    if (durationMs > 1000) {
      logger.warn(`Slow request: ${req.method} ${req.path} took ${Math.round(durationMs)}ms`);
    }
  });

  next();
};

/**
 * Request ID middleware
 */
const requestId = (req, res, next) => {
  const id = req.headers['x-request-id'] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  res.setHeader('X-Request-ID', id);
  req.id = id;
  next();
};

/**
 * Optimize JSON responses
 */
const optimizeJson = (req, res, next) => {
  // Already compressed by compression middleware
  // Add ETag for caching
  const originalSend = res.send;
  
  res.send = (body) => {
    if (res.statusCode === 200 && body) {
      // Generate simple ETag
      const hash = require('crypto')
        .createHash('md5')
        .update(typeof body === 'string' ? body : JSON.stringify(body))
        .digest('hex');
      
      res.setHeader('ETag', `"${hash}"`);
      
      // Check If-None-Match
      const ifNoneMatch = req.headers['if-none-match'];
      if (ifNoneMatch === `"${hash}"`) {
        return res.status(304).end();
      }
    }
    return originalSend(body);
  };
  
  next();
};

/**
 * Database query optimization helpers
 */
const dbOptimizations = {
  /**
   * Add pagination to Prisma queries
   */
  paginate: (query, { page = 1, limit = 20 }) => {
    const skip = (page - 1) * limit;
    return {
      ...query,
      skip,
      take: limit
    };
  },
  
  /**
   * Optimize include statements
   */
  optimizeInclude: (includes) => {
    if (!includes || !Array.isArray(includes)) return includes;
    
    return includes.map(include => {
      // Only select needed fields
      if (typeof include === 'object' && include.select) {
        return {
          ...include,
          // Remove heavy relations from select
          select: Object.fromEntries(
            Object.entries(include.select).filter(([key]) => 
              !['password', 'tokens', ' sensitiveData'].includes(key)
            )
          )
        };
      }
      return include;
    });
  }
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateCache,
  responseTime,
  requestId,
  optimizeJson,
  dbOptimizations
};


