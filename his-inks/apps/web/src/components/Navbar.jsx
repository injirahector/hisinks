import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const NAV_LINKS = [
  { label: 'Home',      to: '/' },
];

// Extra nav links shown only when a user is logged in
const AUTH_NAV_LINKS = [
  { label: 'Portfolio', to: '/portfolio' },
  { label: 'About',     to: '/about' },
  { label: 'Contact',   to: '/contact' },
];

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ user }) {
  const initials = `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-8 h-8 rounded-full bg-brand-accent/20 border border-brand-accent/40
                    flex items-center justify-center flex-shrink-0">
      <span className="text-brand-accent text-xs font-medium tracking-wide">{initials}</span>
    </div>
  );
}

// ── Notification type icon colours ────────────────────────────────────────────
const TYPE_STYLES = {
  booking_confirmed:    { dot: 'bg-blue-400' },
  booking_cancelled:    { dot: 'bg-red-400' },
  booking_completed:    { dot: 'bg-green-400' },
  consultation_reply:   { dot: 'bg-brand-accent' },
  consultation_agreed:  { dot: 'bg-yellow-400' },
  deposit_confirmed:    { dot: 'bg-green-400' },
  deposit_rejected:     { dot: 'bg-red-400' },
  direct_message_reply: { dot: 'bg-purple-400' },
};

// ── Notification bell + dropdown ──────────────────────────────────────────────
function NotificationBell() {
  const { unreadCount, notifications, loading, fetchedOnce, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  // Fetch list when dropdown opens for the first time
  useEffect(() => {
    if (open && !fetchedOnce) {
      fetchNotifications();
    }
  }, [open, fetchedOnce, fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n._id);
    if (n.link) {
      navigate(n.link);
      setOpen(false);
    }
  };

  const preview = notifications.slice(0, 5);

  return (
    <div className="relative" ref={bellRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-1.5 text-white/50 hover:text-white transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        {/* Bell SVG */}
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-0.5
                           bg-brand-accent text-black text-[10px] font-bold
                           rounded-full flex items-center justify-center leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-[#111] border border-white/10 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className="text-white text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-white/40 text-xs hover:text-brand-accent transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {loading && !fetchedOnce ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : preview.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-white/30 text-sm">No notifications yet</p>
              </div>
            ) : (
              <ul>
                {preview.map((n) => {
                  const dot = TYPE_STYLES[n.type]?.dot ?? 'bg-white/40';
                  return (
                    <li key={n._id}>
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-white/5 transition-colors
                                    border-b border-white/5 last:border-0
                                    ${!n.read ? 'bg-white/3' : ''}`}
                      >
                        {/* Unread dot */}
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${!n.read ? dot : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium truncate ${n.read ? 'text-white/50' : 'text-white'}`}>
                            {n.title}
                          </p>
                          <p className="text-white/35 text-xs mt-0.5 leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                          <p className="text-white/20 text-[10px] mt-1">
                            {new Date(n.createdAt).toLocaleString('en-KE', {
                              month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/8 px-4 py-2.5">
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-brand-accent/70 hover:text-brand-accent transition-colors"
            >
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen]         = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled]         = useState(false);
  const dropdownRef = useRef(null);

  // Transparent → solid after 100px scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500
        ${scrolled
          ? 'bg-[#0B0B0B]/95 backdrop-blur-md border-b border-white/8 shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
          : 'bg-transparent border-b border-transparent'
        }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-brand-accent font-display text-xl tracking-widest uppercase flex-shrink-0">
          His Inks Studio
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) => `nav-link ${isActive ? 'text-brand-accent' : ''}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
          {user && user.role !== 'admin' && AUTH_NAV_LINKS.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `nav-link ${isActive ? 'text-brand-accent' : ''}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <>
              {/* Admin shortcut */}
              {user.role === 'admin' && (
                <Link to="/admin" className="nav-link text-brand-accent/70 hover:text-brand-accent">
                  Dashboard
                </Link>
              )}

              {/* Notification bell */}
              <NotificationBell />

              {/* Profile dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  aria-label="Account menu"
                >
                  <Avatar user={user} />
                  <span className="text-white/70 text-sm max-w-[120px] truncate">
                    {user.firstName}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-white/30 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-[#111] border border-white/10 shadow-xl py-1 z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-white/8">
                      <p className="text-white text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-white/35 text-xs truncate mt-0.5">{user.email}</p>
                    </div>

                    {/* Links */}
                    {user.role === 'customer' && (
                      <>
                        <Link
                          to="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-accent/80
                                     hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                          </svg>
                          My Dashboard
                        </Link>
                        <Link
                          to="/my-bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60
                                     hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                          </svg>
                          My Bookings
                        </Link>
                        <Link
                          to="/my-consultation"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60
                                     hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                          </svg>
                          My Consultation
                        </Link>
                        <Link
                          to="/my-reviews"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60
                                     hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                          </svg>
                          My Reviews
                        </Link>
                        <Link
                          to="/messages"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60
                                     hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                          Messages
                        </Link>
                        <Link
                          to="/referrals"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60
                                     hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round"
                              d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                          </svg>
                          Referrals
                        </Link>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/60
                                   hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                        </svg>
                        Admin Dashboard
                      </Link>
                    )}

                    {/* Logout */}
                    <div className="border-t border-white/8 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm
                                   text-white/50 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round"
                            d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                        </svg>
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link to="/login" className="nav-link">Sign In</Link>
          )}

          {user?.role !== 'admin' && (
            <Link to="/book" className="btn-primary text-xs py-2 px-5">Book Now</Link>
          )}
        </div>
        <button
          className="md:hidden flex flex-col gap-1.5 p-2 ml-2"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`w-6 h-px bg-white transition-transform duration-200 ${menuOpen ? 'rotate-45 translate-y-2.5' : ''}`} />
          <span className={`w-6 h-px bg-white transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`w-6 h-px bg-white transition-transform duration-200 ${menuOpen ? '-rotate-45 -translate-y-2.5' : ''}`} />
        </button>
      </nav>

      {/* ── Mobile menu ──────────────────────────────────────────────────────── */}
      {menuOpen && (
        <div className="md:hidden bg-[#0B0B0B]/98 backdrop-blur-md border-t border-white/8 px-6 py-6 space-y-4">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block text-sm tracking-widest uppercase py-1 transition-colors ${
                  isActive ? 'text-brand-accent' : 'text-white/60 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
          {user && user.role !== 'admin' && AUTH_NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block text-sm tracking-widest uppercase py-1 transition-colors ${
                  isActive ? 'text-brand-accent' : 'text-white/60 hover:text-white'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <div className="border-t border-white/8 pt-4 space-y-1">
            {user ? (
              <>
                {/* User info */}
                <div className="flex items-center gap-3 py-2 mb-2">
                  <Avatar user={user} />
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{user.firstName} {user.lastName}</p>
                    <p className="text-white/30 text-xs truncate">{user.email}</p>
                  </div>
                </div>

                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 text-sm tracking-widest uppercase text-brand-accent/80 hover:text-brand-accent py-2">
                    Dashboard
                  </Link>
                )}
                {user.role === 'customer' && (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-brand-accent/80 hover:text-brand-accent py-2">
                      My Dashboard
                    </Link>
                    <Link to="/my-bookings" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                      My Bookings
                    </Link>
                    <Link to="/my-consultation" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                      My Consultation
                    </Link>
                    <Link to="/my-reviews" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                      My Reviews
                    </Link>
                    <Link to="/messages" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                      Messages
                    </Link>
                    <Link to="/notifications" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                      Notifications
                    </Link>
                    <Link to="/referrals" onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                      Referrals
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-sm tracking-widest uppercase text-white/40 hover:text-red-400 py-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                  </svg>
                  Sign Out
                </button>
              </>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)}
                className="block text-sm tracking-widest uppercase text-white/60 hover:text-white py-2">
                Sign In
              </Link>
            )}
            <div className="pt-2">
              {user?.role !== 'admin' && (
                <Link to="/book" onClick={() => setMenuOpen(false)} className="btn-primary block text-center text-xs py-3">
                  Book Now
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export default Navbar;
