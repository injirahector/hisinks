const { Server } = require('socket.io');
const { verifyToken } = require('../utils/jwt.utils');

// ── Singleton io instance ─────────────────────────────────────────────────────
let _io = null;

/**
 * Initialize Socket.IO on the given HTTP server.
 * Must be called exactly once, from server.js.
 */
function initSocket(httpServer) {
  const ALLOWED_ORIGINS = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:8081',
    'http://localhost:19006',
  ].filter(Boolean);

  _io = new Server(httpServer, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    // Use polling first (works on Render/Vercel), upgrades to WS when possible
    transports: ['polling', 'websocket'],
  });

  // ── JWT authentication middleware ─────────────────────────────────────────
  _io.use(async (socket, next) => {
    try {
      // Token may arrive as auth.token (preferred) or query.token (fallback)
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.query?.token;

      if (!token) {
        // Unauthenticated sockets are rejected — they cannot receive private events
        return next(new Error('Authentication required'));
      }

      const decoded = verifyToken(token);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ────────────────────────────────────────────────────
  _io.on('connection', (socket) => {
    const { userId, userRole } = socket;

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Socket] Connected  userId=${userId} role=${userRole} socketId=${socket.id}`);
    }

    // Join private user room — all user-specific events go here
    socket.join(`user:${userId}`);

    // Join role room — used for admin-wide broadcasts
    if (userRole) {
      socket.join(`role:${userRole}`);
    }

    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[Socket] Disconnected userId=${userId} reason=${reason}`);
      }
    });
  });

  console.log('[Socket] Socket.IO initialized');
  return _io;
}

/**
 * Returns the initialized io instance.
 * Safe to call from any service — returns null if not yet initialized
 * (which means the server hasn't started yet; callers guard this gracefully).
 */
function getIO() {
  return _io;
}

/**
 * Emit an event to a specific user's private room.
 * Silently no-ops if socket hasn't been initialized yet.
 */
function emitToUser(userId, event, payload) {
  if (!_io) return;
  _io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Emit an event to all connected sockets with the given role.
 */
function emitToRole(role, event, payload) {
  if (!_io) return;
  _io.to(`role:${role}`).emit(event, payload);
}

/**
 * Emit an event to all admins.
 */
function emitToAdmins(event, payload) {
  emitToRole('admin', event, payload);
}

module.exports = { initSocket, getIO, emitToUser, emitToAdmins, emitToRole };
