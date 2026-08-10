/**
 * Centralized Socket.IO client singleton.
 *
 * Usage:
 *   import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
 *
 * - connectSocket(token)  — call on login / auth rehydration
 * - disconnectSocket()    — call on logout
 * - getSocket()           — returns the current socket instance (may be null)
 *
 * Components should never call io(...) directly.
 * Event listeners are attached/cleaned in each component via useEffect.
 */
import { io } from 'socket.io-client';

// Derive the Socket.IO server URL from the same env var used by the REST API.
// Strip trailing /api path so we connect to the root of the server.
const RAW_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = RAW_URL.replace(/\/api\/?$/, '');

let _socket = null;

/**
 * Connect (or reconnect) with a fresh JWT token.
 * If already connected with the same token, this is a no-op.
 */
export function connectSocket(token) {
  // If already connected, disconnect first (handles token refresh / re-login)
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }

  if (!token) return null;

  _socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['polling', 'websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    timeout: 10000,
  });

  if (import.meta.env.DEV) {
    _socket.on('connect',       ()      => console.log('[Socket] Connected', _socket.id));
    _socket.on('disconnect',    (reason) => console.log('[Socket] Disconnected', reason));
    _socket.on('connect_error', (err)   => console.warn('[Socket] Connection error', err.message));
  }

  return _socket;
}

/**
 * Disconnect and clear the singleton.
 * Call on logout.
 */
export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

/**
 * Returns the current socket instance, or null if not connected.
 */
export function getSocket() {
  return _socket;
}
