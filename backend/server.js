const dotenv = require("dotenv");
// Load environment variables from .env and force override to ensure local settings take precedence
dotenv.config({ override: true });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const http = require("http");
const { Server } = require("socket.io");
const { connectDB } = require("./config/db");
const { initSocket } = require("./services/socketService");
const { initAutomation } = require("./services/automationService");
const { verifyConnection: verifyEmailConnection } = require("./config/email");
const logger = require("./config/logger");

const normalizeOrigin = (value) => {
  if (typeof value !== 'string') return value;
  return value.replace(/\/$/, '');
};
const { responseTime, requestId } = require("./middleware/performance");
const { securityHeaders, corsOptions, sanitizeInput } = require("./middleware/security");

const app = express();

// Security middleware
app.use(securityHeaders);
app.use(corsOptions);
app.use(sanitizeInput);

// Performance middleware
app.use(responseTime);
app.use(requestId);

// Log all requests for debugging CORS and 404s
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    logger.info(`Preflight request: ${req.method} ${req.path} from ${req.headers.origin}`);
  }
  next();
});

// Render/other proxies set X-Forwarded-For; trust one proxy hop
app.set('trust proxy', 1);

const server = http.createServer(app);
const port = process.env.PORT || 5000;

// 1. CORS - Must be first to handle preflight requests
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ].map(normalizeOrigin);
    const normalizedOrigin = normalizeOrigin(origin);
    if (!origin || allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked request from origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  optionsSuccessStatus: 200
}));

// Initialize Socket.io
initSocket(server);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 2. Security & Optimization
app.use(helmet({
  crossOriginResourcePolicy: false, // Allow images from uploads
}));
app.use(compression());

// 3. Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || process.env.RATE_LIMIT_MAX) || 100, // Dynamic limit from .env
  message: { success: false, message: "Too many requests from this IP, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

// 4. Body Parsing
// Specialized middleware to capture raw body for Paystack signature verification
app.use(bodyParser.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/api/payments/webhook')) {
      req.rawBody = buf;
    }
  }
}));
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Database connection
connectDB().then((connected) => {
  // Initialize Background Tasks
  if (process.env.DISABLE_AUTOMATION === 'true') {
    logger.warn('Automation disabled via DISABLE_AUTOMATION');
  } else if (connected) {
    initAutomation();
  } else {
    logger.warn('Skipping automation due to database connection failure');
  }

  // Verify Email Configuration
  if (process.env.EMAIL_VERIFY_ON_START === 'false') {
    logger.info('Email verification skipped via EMAIL_VERIFY_ON_START');
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    logger.warn('Email credentials missing - skipping verification');
    return;
  }

  verifyEmailConnection().then(success => {
    if (success) {
      logger.info('Email service ready');
    } else {
      logger.warn('Email service failed to initialize - check credentials');
    }
  });
});

// API routes - Move these ABOVE the site renderer to avoid conflicts
const authRoutes = require("./routes/authRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
const adminRoutes = require("./routes/adminRoutes");
const blogRoutes = require("./routes/blogRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const clientRoutes = require("./routes/clientRoutes");
const subscriptionRoutes = require("./routes/subscriptionRoutes");
const requestManagedDomainRoute = require("./routes/requestManagedDomain");
const contactRoutes = require("./routes/contactRoutes");
const newsletterRoutes = require("./routes/newsletterRoutes");
const monitoringRoutes = require("./routes/monitoringRoutes");
const supportRoutes = require("./routes/supportRoutes");
const mediaRoutes = require("./routes/mediaRoutes");
const ecommerceRoutes = require("./routes/ecommerceRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const swaggerRoutes = require("./routes/swaggerRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/assessment", assessmentRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/request-managed-domain", requestManagedDomainRoute);
app.use("/api/contact", contactRoutes);
app.use("/api/newsletter", newsletterRoutes);
app.use("/api/monitoring", monitoringRoutes);
app.use("/api/support", supportRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/ecommerce", ecommerceRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api-docs", swaggerRoutes);

const authMiddleware = require("./middleware/auth");

// Preview route for admins
app.get('/preview/:subscriptionId', authMiddleware.authenticate, authMiddleware.requireAdmin, async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { prisma } = require('./config/db');
    
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { template: true }
    });
    
    if (!subscription) {
      return res.status(404).send('Subscription not found');
    }
    
    const template = subscription.template;
    
    if (!template) {
      return res.status(404).send('Template not found for this subscription');
    }
    
    const { html, css, js } = template;
    let finalHtml = html;
    if (css && !html.includes('<style>')) {
        finalHtml = finalHtml.replace('</head>', `<style>${css}</style></head>`);
    }
    if (js && !html.includes('<script>')) {
        finalHtml = finalHtml.replace('</body>', `<script>${js}</script></body>`);
    }
    
    res.send(finalHtml);
  } catch (error) {
    logger.error('PREVIEW_ERROR:', error);
    res.status(500).send('Error loading preview');
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Sitemendr Backend API'
  });
});

// Site Rendering (Dynamic Sites)
const siteRendererController = require("./controllers/siteRendererController");
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return next();
  }
  siteRendererController.renderSite(req, res, next);
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('SERVER_ERROR:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.method !== 'GET' ? req.body : undefined,
    user: req.user ? req.user.id : 'anonymous'
  });
  
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected infrastructure error occurred.' 
      : err.message
  });
});

// 404 handler
app.use((req, res) => {
  logger.warn('404_NOT_FOUND:', { path: req.path, method: req.method });
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

const serverInstance = server.listen(port, () => {
  logger.info(`🚀 Sitemendr Backend API running on port ${port}`);
  logger.info(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Graceful Shutdown Handler
const gracefulShutdown = () => {
  logger.info('🛑 Received kill signal, shutting down gracefully');
  serverInstance.close(() => {
    logger.info('📡 Closed out remaining connections');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('🔥 Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);


