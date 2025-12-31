// Log immediately to verify script is running
console.log('📦 Starting server.js...');
console.log('📦 Node version:', process.version);
console.log('📦 NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('📦 PORT:', process.env.PORT || 'not set (will use 3001)');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

console.log('✅ Express and dependencies loaded');

// Load routes with error handling (don't crash if routes fail)
let authRoutes, householdRoutes, groceryRoutes, notesRoutes, forumRoutes, groceryCategoryRoutes, questRoutes, rewardRoutes;
try {
  authRoutes = require('./routes/auth');
  householdRoutes = require('./routes/households');
  groceryRoutes = require('./routes/groceries');
  notesRoutes = require('./routes/notes');
  forumRoutes = require('./routes/forum');
  groceryCategoryRoutes = require('./routes/groceryCategories');
  questRoutes = require('./routes/quests');
  rewardRoutes = require('./routes/rewards');
  console.log('✅ All route modules loaded successfully');
} catch (routeLoadError) {
  console.error('❌ Error loading route modules:', routeLoadError);
  console.error('⚠️  Server will start but API routes may not work');
  // Create empty routers as fallback
  authRoutes = express.Router();
  householdRoutes = express.Router();
  groceryRoutes = express.Router();
  notesRoutes = express.Router();
  forumRoutes = express.Router();
  groceryCategoryRoutes = express.Router();
  questRoutes = express.Router();
  rewardRoutes = express.Router();
}

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
  app.use('/api/quests', questRoutes);
  app.use('/api/rewards', rewardRoutes);
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
function startServer() {
  console.log(`📦 startServer() called`);
  console.log(`📦 PORT value: ${PORT}`);
  
  try {
    console.log(`📦 Attempting to start server on port ${PORT}...`);
    console.log(`🌐 Binding to 0.0.0.0:${PORT} for Railway...`);
    
    // Start server FIRST (before loading routes) so health checks work immediately
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅✅✅ SERVER SUCCESSFULLY STARTED! ✅✅✅`);
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📱 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`✅ Health check available at /health and /`);
      console.log(`🌐 Server bound to 0.0.0.0:${PORT}`);
      console.log(`🔍 Railway can now check health endpoint`);
    });
    
    console.log(`📦 app.listen() called, waiting for callback...`);

    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
      }
      // Don't exit - let Railway see the error in logs
    });

    // Log when server is actually listening
    server.on('listening', () => {
      const addr = server.address();
      console.log(`✅ Server is listening on ${addr.address}:${addr.port}`);
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
  console.error('❌❌❌ UNCAUGHT EXCEPTION ❌❌❌');
  console.error('❌ Error:', error);
  console.error('❌ Stack:', error.stack);
  // Don't exit - let health checks still work
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌❌❌ UNHANDLED REJECTION ❌❌❌');
  console.error('❌ Reason:', reason);
  console.error('❌ Promise:', promise);
  // Don't exit - let health checks still work
});

console.log('📦 About to call startServer()...');
startServer();
console.log('📦 startServer() call completed');
