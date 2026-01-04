const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { query } = require('../database/connection');

let io;

const setupSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST']
    }
  });

  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Verify user exists and is active
      const userResult = await query(
        'SELECT id, username, household_id, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return next(new Error('User not found'));
      }

      socket.user = userResult.rows[0];
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User ${socket.user.username} connected to household ${socket.user.household_id}`);

    // Join household room
    socket.join(`household_${socket.user.household_id}`);

    // Handle joining specific thread rooms
    socket.on('join_thread', (threadId) => {
      socket.join(`thread_${threadId}`);
      console.log(`User ${socket.user.username} joined thread ${threadId}`);
    });

    socket.on('leave_thread', (threadId) => {
      socket.leave(`thread_${threadId}`);
      console.log(`User ${socket.user.username} left thread ${threadId}`);
    });

    // Handle new forum post
    socket.on('new_post', (data) => {
      // Broadcast to all users in the thread
      socket.to(`thread_${data.threadId}`).emit('post_added', {
        ...data,
        author: socket.user.username,
        timestamp: new Date().toISOString()
      });
    });

    // Handle new note
    socket.on('new_note', (data) => {
      // Broadcast to all users in the household
      socket.to(`household_${socket.user.household_id}`).emit('note_added', {
        ...data,
        author: socket.user.username,
        timestamp: new Date().toISOString()
      });
    });

    // Handle grocery item updates
    socket.on('grocery_updated', (data) => {
      // Broadcast to all users in the household
      socket.to(`household_${socket.user.household_id}`).emit('grocery_updated', {
        ...data,
        updatedBy: socket.user.username,
        timestamp: new Date().toISOString()
      });
    });

    // Handle user typing indicators
    socket.on('typing_start', (data) => {
      socket.to(`thread_${data.threadId}`).emit('user_typing', {
        username: socket.user.username,
        threadId: data.threadId
      });
    });

    socket.on('typing_stop', (data) => {
      socket.to(`thread_${data.threadId}`).emit('user_stopped_typing', {
        username: socket.user.username,
        threadId: data.threadId
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${socket.user.username} disconnected`);
    });
  });

  return io;
};

// Helper function to emit to specific household
const emitToHousehold = (householdId, event, data) => {
  if (io) {
    io.to(`household_${householdId}`).emit(event, data);
  }
};

// Helper function to emit to specific thread
const emitToThread = (threadId, event, data) => {
  if (io) {
    io.to(`thread_${threadId}`).emit(event, data);
  }
};

module.exports = {
  setupSocketIO,
  emitToHousehold,
  emitToThread
};
