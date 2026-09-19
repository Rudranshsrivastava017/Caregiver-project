const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer, clientOrigin = 'http://localhost:5173') => {
  io = new Server(httpServer, {
    cors: {
      origin: [clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  // Socket Auth Handshake Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      // Allow unauthenticated connection or proceed anonymously if desired
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || 'careelderly_jwt_access_secret_2026');
      socket.user = decoded;
      next();
    } catch (err) {
      console.warn('[Socket Auth] Token verification failed:', err.message);
      next();
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket Connected] Client ID: ${socket.id}`);

    // Automatically join room for authenticated user
    if (socket.user?.sub || socket.user?.userId) {
      const userId = socket.user.sub || socket.user.userId;
      socket.join(userId);
      console.log(`[Socket Room] User ${userId} joined their notification room.`);
    }

    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`[Socket Room] Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket Disconnected] Client ID: ${socket.id}`);
    });
  });

  return io;
};

// Helper notification emitters
const emitBookingStatusUpdate = (userId, bookingId, status) => {
  if (io) {
    io.to(userId).emit('booking:statusUpdated', { bookingId, status, timestamp: new Date() });
    io.emit('booking:statusUpdated', { bookingId, status, timestamp: new Date() });
  }
};

const emitNewCaregiverRequest = (caregiverUserId, bookingId, summary) => {
  if (io) {
    io.to(caregiverUserId).emit('caregiver:newRequest', { bookingId, summary, timestamp: new Date() });
  }
};

const emitCareNoteAdded = (familyUserId, bookingId, noteId) => {
  if (io) {
    io.to(familyUserId).emit('careNote:added', { bookingId, noteId, timestamp: new Date() });
    io.emit('careNote:added', { bookingId, noteId, timestamp: new Date() });
  }
};

module.exports = {
  initSocket,
  emitBookingStatusUpdate,
  emitNewCaregiverRequest,
  emitCareNoteAdded,
};
