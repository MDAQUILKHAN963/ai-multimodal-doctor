const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

function init(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true },
  });

  // Authenticate every socket connection with the JWT
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.sub;
      socket.userName = payload.name;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    // Each user gets their own room so emits are targeted
    socket.join(`user:${socket.userId}`);
    console.log(`[socket] ${socket.userName || socket.userId} connected (${socket.id})`);

    socket.on('disconnect', () => {
      console.log(`[socket] ${socket.userId} disconnected`);
    });
  });

  return io;
}

// Emit an event to a specific user (all their connected tabs/devices)
function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data);
}

module.exports = { init, emitToUser };
