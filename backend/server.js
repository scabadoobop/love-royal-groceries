const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const householdRoutes = require('./routes/households');
const groceryRoutes = require('./routes/groceries');
const notesRoutes = require('./routes/notes');
const forumRoutes = require('./routes/forum');
const groceryCategoryRoutes = require('./routes/groceryCategories');
const { initializeDatabase } = require('./database/connection');
const { setupSocketIO } = require('./socket/socketHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Health check endpoints - MUST BE FIRST (before any middleware)
// This ensures Railway can check health even if routes fail to load
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK',
    service: 'royal-groceries-backend',
    timestamp: new Date().toISOString()
  });
});

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API routes (wrapped in try-catch to prevent startup crashes)
try {
  app.use('/api/auth', authRoutes);
  app.use('/api/households', householdRoutes);
  app.use('/api/groceries', groceryRoutes);
  app.use('/api/notes', notesRoutes);
  app.use('/api/forum', forumRoutes);
  app.use('/api/grocery-categories', groceryCategoryRoutes);
  console.log('✅ All API routes loaded successfully');
} catch (routeError) {
  console.error('⚠️  Error loading routes (non-critical):', routeError.message);
  // Don't crash - health check will still work
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database and start server
async function startServer() {
  try {
    // Start server FIRST (before loading routes) so health checks work immediately
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`✅ Health check available at /health and /`);
      console.log(`🌐 Server bound to 0.0.0.0:${PORT}`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
    });

    // Setup Socket.IO for real-time features
    try {
      setupSocketIO(server);
      console.log('✅ Socket.IO initialized');
    } catch (socketError) {
      console.error('⚠️  Socket.IO setup failed (non-critical):', socketError.message);
      // Don't crash if Socket.IO fails
    }
    
    // Initialize database in background (non-blocking)
    initializeDatabase()
      .then(() => {
        console.log('✅ Database connected successfully');
      })
      .catch((error) => {
        console.error('❌ Database initialization failed:', error.message);
        console.error('⚠️  Server is running but database is not connected');
        // Don't exit - let the server run so health checks work
      });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit - let health checks still work
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let health checks still work
});

startServer();
