import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const POLL_INTERVAL_MS = 30_000; // 30 seconds

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount]       = useState(0);
  const [notifications, setNotifications]   = useState([]);
  const [loading, setLoading]               = useState(false);
  const [fetchedOnce, setFetchedOnce]       = useState(false);
  const intervalRef = useRef(null);

  // ── Fetch unread badge count ───────────────────────────────────────────────
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications/unread-count');
      setUnreadCount(res.data.data.count);
    } catch {
      // Silently ignore — badge will show last known count
    }
  }, [user]);

  // ── Fetch full notification list ──────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.data.notifications);
      setFetchedOnce(true);
      // Sync badge with fetched data
      const unread = res.data.data.notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ── Mark one notification as read ─────────────────────────────────────────
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

  // ── Poll for unread count while user is logged in ─────────────────────────
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setNotifications([]);
      setFetchedOnce(false);
      return;
    }

    // Immediate fetch on login
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
