import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socket';

const NotificationContext = createContext(null);

// Polling is kept as a fallback in case the socket misses an event
// (e.g. tab was backgrounded or socket briefly dropped).
const POLL_INTERVAL_MS = 120_000; // 2 minutes — much less aggressive than before

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [fetchedOnce, setFetchedOnce]     = useState(false);
  const intervalRef = useRef(null);

  // ── Fetch unread badge count ──────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count);
    } catch {
      // Silently ignore
    }
  }, [user]);

  // ── Fetch full notification list ─────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data.notifications);
      setFetchedOnce(true);
      const unread = res.data.data.notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Mark one as read ──────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Ignore
    }
  }, []);

  // ── Mark all as read ──────────────────────────────────────────────────────
  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // Ignore
    }
  }, []);

  // ── Socket: listen for notification.created ───────────────────────────────
  useEffect(() => {
    if (!user) return;

    // Poll a short time after mount to let the socket connect first
    const timer = setTimeout(fetchUnreadCount, 500);

    // Attach socket listener — re-runs whenever user changes (login/logout)
    const attachListener = () => {
      const socket = getSocket();
      if (!socket) return;

      const handler = (notification) => {
        // Prepend to list (dedup by _id in case REST and socket overlap)
        setNotifications((prev) => {
          if (prev.some((n) => n._id === notification._id)) return prev;
          return [notification, ...prev];
        });
        setUnreadCount((prev) => prev + 1);
        setFetchedOnce(true);
      };

      socket.on('notification.created', handler);
      return () => socket.off('notification.created', handler);
    };

    // The socket may not be connected yet at render time (it's async).
    // Retry attaching for up to 3 seconds.
    let cleanup = attachListener();
    let attempts = 0;
    const retryTimer = setInterval(() => {
      if (cleanup || attempts >= 6) { clearInterval(retryTimer); return; }
      cleanup = attachListener();
      attempts++;
    }, 500);

    return () => {
      clearTimeout(timer);
      clearInterval(retryTimer);
      if (cleanup) cleanup();
    };
  }, [user, fetchUnreadCount]);

  // ── Fallback polling ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setFetchedOnce(false);
      return;
    }

    fetchUnreadCount();
    intervalRef.current = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [user, fetchUnreadCount]);

  const value = {
    unreadCount,
    notifications,
    loading,
    fetchedOnce,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within <NotificationProvider>');
  return ctx;
}

export default NotificationContext;
