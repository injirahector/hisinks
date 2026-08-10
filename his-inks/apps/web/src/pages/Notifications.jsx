import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import ReviewModal from '../components/ReviewModal';

// ── Visual config per notification type ───────────────────────────────────────
const TYPE_CONFIG = {
  // ── Booking ─────────────────────────────────────────────────────────────────
  booking_pending: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    iconClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  },
  booking_confirmed: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconClass: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  },
  booking_cancelled: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconClass: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  booking_completed: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V2.75a.75.75 0 01.75-.75 2.25 2.25 0 012.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.9M14.25 9h2.25M5.9 12.98a3.001 3.001 0 00-.9.02M5.9 12.98V21" />
      </svg>
    ),
    iconClass: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  // ── Consultation ─────────────────────────────────────────────────────────────
  consultation_reply: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    iconClass: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20',
  },
  consultation_agreed: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconClass: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  },
  consultation_closed: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    iconClass: 'text-white/40 bg-white/5 border-white/10',
  },
  // ── Deposit / payment ─────────────────────────────────────────────────────────
  deposit_confirmed: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
    iconClass: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  deposit_rejected: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
      </svg>
    ),
    iconClass: 'text-red-400 bg-red-400/10 border-red-400/20',
  },
  // ── Messages ──────────────────────────────────────────────────────────────────
  direct_message_reply: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
      </svg>
    ),
    iconClass: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
  },
  // ── Reviews ───────────────────────────────────────────────────────────────────
  artist_review_reply: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    ),
    iconClass: 'text-brand-accent bg-brand-accent/10 border-brand-accent/20',
  },
  // ── Referrals ─────────────────────────────────────────────────────────────────
  referral_commission_eligible: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    iconClass: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
  referral_paid: {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    iconClass: 'text-green-400 bg-green-400/10 border-green-400/20',
  },
};

const DEFAULT_CONFIG = {
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
    </svg>
  ),
  iconClass: 'text-white/40 bg-white/5 border-white/10',
};

function fmtTime(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs  = now - d;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr  = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1)  return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr  < 24) return `${diffHr}h ago`;
  if (diffDay < 7)  return `${diffDay}d ago`;
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Notification card ─────────────────────────────────────────────────────────
function NotificationCard({ notification, onMarkRead, onRateSession }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[notification.type] || DEFAULT_CONFIG;

  const handleClick = () => {
    if (!notification.read) onMarkRead(notification._id);

    // booking_completed → open the review modal instead of navigating
    if (notification.type === 'booking_completed') {
      onRateSession();
      return;
    }

    if (notification.link) navigate(notification.link);
  };

  const isCompleted = notification.type === 'booking_completed';

  return (
    <div
      className={`flex gap-4 p-5 border transition-colors cursor-pointer
                  hover:bg-white/3
                  ${notification.read
                    ? 'border-white/8 bg-transparent'
                    : 'border-white/12 bg-white/3'}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {/* Icon */}
      <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center
                       border rounded-full ${cfg.iconClass}`}>
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-sm font-medium leading-snug ${notification.read ? 'text-white/60' : 'text-white'}`}>
            {notification.title}
          </p>
          <span className="text-white/25 text-xs flex-shrink-0 mt-0.5">
            {fmtTime(notification.createdAt)}
          </span>
        </div>
        <p className="text-white/45 text-sm mt-1 leading-relaxed">
          {notification.message}
        </p>
        {/* CTA text */}
        <p className={`text-xs mt-2 transition-colors ${
          isCompleted
            ? 'text-brand-accent/80 hover:text-brand-accent'
            : 'text-brand-accent/60 hover:text-brand-accent'
        }`}>
          {isCompleted ? '★ Tap to rate your session →' : 'View details →'}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.read && (
        <div className="w-2 h-2 rounded-full bg-brand-accent flex-shrink-0 mt-2" />
      )}
    </div>
  );
}

// ── Notifications page ────────────────────────────────────────────────────────
function Notifications() {
  const { user, loading: authLoading } = useAuth();
  const { notifications, loading, fetchedOnce, fetchNotifications, markAsRead, markAllAsRead, unreadCount } =
    useNotifications();
  const navigate = useNavigate();

  // booking to show in the review modal
  const [ratingBooking, setRatingBooking] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  // Fetch on mount if not already loaded
  useEffect(() => {
    if (user && !fetchedOnce) fetchNotifications();
  }, [user, fetchedOnce, fetchNotifications]);

  // Fetch the first completed unreviewed booking to pass to the modal
  const openRateModal = useCallback(async () => {
    setLoadingBooking(true);
    try {
      const [bookingsRes, reviewsRes] = await Promise.all([
        api.get('/users/my-bookings'),
        api.get('/reviews/me').catch(() => ({ data: { data: { reviews: [] } } })),
      ]);

      const allBookings  = bookingsRes.data.data.bookings;
      const reviewedIds  = new Set(
        reviewsRes.data.data.reviews.map((r) => r.appointment?._id).filter(Boolean)
      );

      const target = allBookings.find(
        (b) => b.status === 'completed' && !reviewedIds.has(b._id)
      );

      if (target) {
        setRatingBooking(target);
      } else {
        // All sessions already reviewed — navigate to the reviews page instead
        navigate('/my-reviews');
      }
    } catch {
      navigate('/my-reviews');
    } finally {
      setLoadingBooking(false);
    }
  }, [navigate]);

  if (authLoading) return null;

  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">
        {/* Page header */}
        <div className="mb-10">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Account</p>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl text-white mb-2">Notifications</h1>
              <p className="text-white/40 text-sm">Updates about your bookings and consultations.</p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex-shrink-0 text-xs text-white/40 hover:text-brand-accent
                           border border-white/10 hover:border-brand-accent/30
                           px-4 py-2 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Loading overlay for booking fetch */}
        {loadingBooking && (
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center">
            <div className="text-white/60 text-sm">Loading…</div>
          </div>
        )}

        {/* Content */}
        {loading && !fetchedOnce ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="border border-dashed border-white/10 py-24 text-center">
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </div>
            <p className="text-white/30 text-sm">You have no notifications yet</p>
            <p className="text-white/20 text-xs mt-1">
              You&apos;ll be notified about booking and consultation updates here.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Unread section */}
            {notifications.some((n) => !n.read) && (
              <>
                <p className="text-white/25 text-xs uppercase tracking-widest pb-1">Unread</p>
                {notifications
                  .filter((n) => !n.read)
                  .map((n) => (
                    <NotificationCard
                      key={n._id}
                      notification={n}
                      onMarkRead={markAsRead}
                      onRateSession={openRateModal}
                    />
                  ))}
              </>
            )}

            {/* Earlier (read) section */}
            {notifications.some((n) => n.read) && (
              <>
                <p className="text-white/25 text-xs uppercase tracking-widest pt-4 pb-1">Earlier</p>
                {notifications
                  .filter((n) => n.read)
                  .map((n) => (
                    <NotificationCard
                      key={n._id}
                      notification={n}
                      onMarkRead={markAsRead}
                      onRateSession={openRateModal}
                    />
                  ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Review modal */}
      {ratingBooking && (
        <ReviewModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSaved={() => {
            // After saving, mark this booking as reviewed locally
            // (modal stays open to show success state — user clicks Done to close)
          }}
        />
      )}
    </div>
  );
}

export default Notifications;
