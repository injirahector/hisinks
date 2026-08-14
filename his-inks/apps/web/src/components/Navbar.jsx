import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

// ── Navigation structure ──────────────────────────────────────────────────────
const PUBLIC_NAV = [
  { label: 'Home',        type: 'route',  to: '/'            },
  { label: 'Portfolio',   type: 'route',  to: '/portfolio'   },
  { label: 'Inspiration', type: 'route',  to: '/inspiration' },
  { label: 'Reviews',     type: 'anchor', to: '/#reviews'    },
  { label: 'About',       type: 'route',  to: '/about'       },
  { label: 'Contact',     type: 'route',  to: '/contact'     },
];

// ── Shared inline style tokens ────────────────────────────────────────────────
const DROPDOWN_STYLE = {
  background:           'rgba(18, 18, 18, 0.98)',
  backdropFilter:       'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border:               '1px solid rgba(212, 175, 55, 0.12)',
  boxShadow:            '0 15px 40px rgba(0, 0, 0, 0.45)',
};

// ── Avatar — profile photo or single first-name initial ──────────────────────
// Shows profileImage when available; falls back to the first letter of
// firstName only (not two initials). 40×40 circle, gold border, dark fill.
function Avatar({ user, size = 40 }) {
  const letter = (user.firstName?.[0] ?? '?').toUpperCase();

  if (user.profileImage) {
    return (
      <div
        className="flex-shrink-0 overflow-hidden transition-opacity duration-150"
        style={{
          width: size, height: size,
          borderRadius: '50%',
          border: '1px solid rgba(212, 175, 55, 0.35)',
          background: '#121212',
        }}
      >
        <img
          src={user.profileImage}
          alt={user.firstName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: size, height: size,
        borderRadius: '50%',
        background: '#121212',
        border: '1px solid rgba(212, 175, 55, 0.35)',
      }}
    >
      <span style={{
        color: '#D4AF37',
        fontSize: size * 0.4,
        fontWeight: 500,
        letterSpacing: '0.02em',
        lineHeight: 1,
        fontFamily: 'Georgia, serif',
      }}>
        {letter}
      </span>
    </div>
  );
}

// ── Notification type dot colours ─────────────────────────────────────────────
const TYPE_STYLES = {
  booking_pending:              { dot: 'bg-yellow-400' },
  booking_confirmed:            { dot: 'bg-blue-400'   },
  booking_cancelled:            { dot: 'bg-red-400'    },
  booking_completed:            { dot: 'bg-green-400'  },
  consultation_reply:           { dot: 'bg-yellow-500' },
  consultation_agreed:          { dot: 'bg-yellow-400' },
  consultation_closed:          { dot: 'bg-white/40'   },
  deposit_confirmed:            { dot: 'bg-green-400'  },
  deposit_rejected:             { dot: 'bg-red-400'    },
  admin_deposit_submitted:      { dot: 'bg-yellow-400' },
  direct_message_reply:         { dot: 'bg-purple-400' },
  admin_direct_message:         { dot: 'bg-purple-400' },
  artist_review_reply:          { dot: 'bg-yellow-500' },
  referral_commission_eligible: { dot: 'bg-green-400'  },
  referral_paid:                { dot: 'bg-green-400'  },
  admin_new_booking:            { dot: 'bg-blue-400'   },
  admin_consultation_message:   { dot: 'bg-yellow-500' },
  admin_new_review:             { dot: 'bg-yellow-400' },
};

// ── Notification bell + dropdown ──────────────────────────────────────────────
function NotificationBell() {
  const { unreadCount, notifications, loading, fetchedOnce, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    if (open && !fetchedOnce) fetchNotifications();
  }, [open, fetchedOnce, fetchNotifications]);

  useEffect(() => {
    const handler = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n._id);
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  const preview = notifications.slice(0, 5);

  return (
    <div className="relative" ref={bellRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 transition-colors duration-150"
        style={{ color: 'rgba(245,245,245,0.5)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,245,0.5)'}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] px-0.5
                           text-black text-[9px] font-bold
                           flex items-center justify-center leading-none"
            style={{ background: '#D4AF37', borderRadius: '999px' }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 mt-2.5 w-[300px] z-[60] overflow-hidden" style={DROPDOWN_STYLE}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid rgba(212, 175, 55, 0.10)' }}>
            <span className="text-xs font-semibold tracking-[0.15em] uppercase"
              style={{ color: 'rgba(245,245,245,0.5)' }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] transition-colors duration-150"
                style={{ color: 'rgba(212,175,55,0.6)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,175,55,0.6)'}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-72 overflow-y-auto">
            {loading && !fetchedOnce ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                ))}
              </div>
            ) : preview.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-xs" style={{ color: 'rgba(245,245,245,0.25)' }}>No notifications yet</p>
              </div>
            ) : (
              <ul>
                {preview.map((n) => {
                  const dot = TYPE_STYLES[n.type]?.dot ?? 'bg-white/40';
                  return (
                    <li key={n._id}>
                      <button
                        onClick={() => handleNotificationClick(n)}
                        className="w-full text-left flex gap-3 px-4 py-3 transition-colors duration-150"
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: !n.read ? 'rgba(212,175,55,0.03)' : 'transparent',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = !n.read ? 'rgba(212,175,55,0.03)' : 'transparent'}
                      >
                        <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${!n.read ? dot : 'bg-transparent'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate"
                            style={{ color: n.read ? 'rgba(245,245,245,0.45)' : '#F5F5F5' }}>
                            {n.title}
                          </p>
                          <p className="text-[11px] mt-0.5 leading-relaxed line-clamp-2"
                            style={{ color: 'rgba(245,245,245,0.30)' }}>
                            {n.message}
                          </p>
                          <p className="text-[10px] mt-1" style={{ color: 'rgba(245,245,245,0.18)' }}>
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
          <div className="px-4 py-2.5" style={{ borderTop: '1px solid rgba(212,175,55,0.10)' }}>
            <Link
              to="/notifications"
              onClick={() => setOpen(false)}
              className="text-[11px] tracking-wider uppercase transition-colors duration-150"
              style={{ color: 'rgba(212,175,55,0.6)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,175,55,0.6)'}
            >
              View all →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── NavItem — handles both route and anchor links ─────────────────────────────
function NavItem({ item, active, onClick }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    if (item.type === 'anchor') {
      e.preventDefault();
      const hash = item.to.replace('/', '');
      if (location.pathname === '/') {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/' + hash);
      }
    }
    onClick?.();
  };

  // Shared link style applied via inline events for precision
  const baseStyle = { color: active ? '#D4AF37' : 'rgba(245,245,245,0.60)' };

  const linkCls = 'text-[11px] tracking-[0.14em] uppercase font-medium transition-colors duration-150';

  if (item.type === 'anchor') {
    return (
      <a
        href={item.to}
        onClick={handleClick}
        className={linkCls}
        style={baseStyle}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#D4AF37'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(245,245,245,0.60)'; }}
      >
        {item.label}
      </a>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClick}
      className={linkCls}
      style={({ isActive }) => ({ color: isActive ? '#D4AF37' : 'rgba(245,245,245,0.60)' })}
      onMouseEnter={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.color = '#D4AF37'; }}
      onMouseLeave={e => { if (!e.currentTarget.getAttribute('aria-current')) e.currentTarget.style.color = 'rgba(245,245,245,0.60)'; }}
    >
      {item.label}
    </NavLink>
  );
}

// ── Profile dropdown section label ───────────────────────────────────────────
function DropdownSection({ label }) {
  return (
    <p className="px-4 pt-3 pb-1.5 text-[9px] font-semibold tracking-[0.20em] uppercase"
      style={{ color: 'rgba(212,175,55,0.50)' }}>
      {label}
    </p>
  );
}

// ── Profile dropdown link row ─────────────────────────────────────────────────
function DropdownLink({ to, state, label, onClick }) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      className="flex items-center px-4 py-[7px] text-[12px] tracking-wide transition-colors duration-150"
      style={{ color: 'rgba(245,245,245,0.60)' }}
      onMouseEnter={e => {
        e.currentTarget.style.color = '#D4AF37';
        e.currentTarget.style.background = 'rgba(212,175,55,0.05)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(245,245,245,0.60)';
        e.currentTarget.style.background = 'transparent';
      }}
    >
      {label}
    </Link>
  );
}

// ── Main Navbar ───────────────────────────────────────────────────────────────
function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen,     setMenuOpen]     = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled,     setScrolled]     = useState(false);
  const dropdownRef = useRef(null);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname, location.hash]);

  // Scroll threshold: 50px
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close profile dropdown on outside click
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

  const isAnchorActive = (item) => {
    if (item.type !== 'anchor') return false;
    const hash = item.to.split('#')[1];
    return location.pathname === '/' && location.hash === `#${hash}`;
  };

  const isAdmin = user?.role === 'admin';

  // ── Header background ─────────────────────────────────────────────────────
  // At top of page: rgba(18,18,18,0.90) / blur(16px) — spec value
  // After scroll:   rgba(18,18,18,0.96) / blur(18px) — more opaque
  const headerStyle = scrolled || menuOpen
    ? {
        background:           'rgba(18, 18, 18, 0.96)',
        backdropFilter:       'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom:         '1px solid rgba(212, 175, 55, 0.18)',
        boxShadow:            '0 10px 30px rgba(0, 0, 0, 0.35)',
      }
    : {
        background:           'rgba(18, 18, 18, 0.90)',
        backdropFilter:       'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom:         '1px solid rgba(212, 175, 55, 0.12)',
        boxShadow:            '0 8px 30px rgba(0, 0, 0, 0.35)',
      };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={headerStyle}
    >
      {/* ── Main nav row — 68px tall ── */}
      <nav className="max-w-7xl mx-auto px-8 h-[68px] flex items-center gap-10">

        {/* Logo — fixed width so centred nav truly centres */}
        <Link
          to="/"
          className="font-display text-lg tracking-[0.25em] uppercase flex-shrink-0"
          style={{ color: '#D4AF37', minWidth: 'max-content' }}
        >
          His Inks Studio
        </Link>

        {/* ── Desktop nav links ── */}
        {!isAdmin && (
          <ul className="hidden lg:flex items-center gap-8 flex-1 justify-center">
            {PUBLIC_NAV.map((item) => (
              <li key={item.to}>
                <NavItem item={item} active={isAnchorActive(item)} />
              </li>
            ))}
          </ul>
        )}

        {isAdmin && (
          <div className="hidden lg:flex flex-1 justify-center">
            <Link
              to="/admin"
              className="text-[11px] tracking-[0.14em] uppercase font-medium transition-colors duration-150"
              style={{ color: 'rgba(212,175,55,0.70)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(212,175,55,0.70)'}
            >
              Admin Dashboard
            </Link>
          </div>
        )}

        {/* ── Right cluster: bell · profile · CTA ── */}
        <div className="hidden lg:flex items-center gap-4 flex-shrink-0">
          {user ? (
            <>
              <NotificationBell />

              {/* Profile dropdown trigger */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 group"
                  style={{ outline: 'none' }}
                  aria-label="Account menu"
                  aria-expanded={dropdownOpen}
                >
                  {/* Avatar — scales hover opacity gently */}
                  <div style={{ opacity: dropdownOpen ? 0.85 : 1, transition: 'opacity 150ms' }}>
                    <Avatar user={user} size={36} />
                  </div>
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"
                    style={{ color: 'rgba(245,245,245,0.25)' }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* ── Profile dropdown panel ── */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-3 w-[200px] z-[60] overflow-hidden" style={DROPDOWN_STYLE}>

                    {/* Identity header */}
                    <div className="px-4 py-3.5"
                      style={{ borderBottom: '1px solid rgba(212,175,55,0.10)' }}>
                      <p className="text-[13px] font-medium truncate" style={{ color: '#F5F5F5' }}>
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] mt-0.5 truncate" style={{ color: 'rgba(245,245,245,0.30)' }}>
                        {user.email}
                      </p>
                    </div>

                    {/* Customer account links — grouped */}
                    {user.role === 'customer' && (
                      <>
                        {/* Account group */}
                        <DropdownSection label="Account" />
                        <DropdownLink
                          to="/dashboard"
                          state={{ tab: 'profile' }}
                          label="My Profile"
                          onClick={() => setDropdownOpen(false)}
                        />
                        <DropdownLink to="/dashboard"       label="My Dashboard"    onClick={() => setDropdownOpen(false)} />
                        <DropdownLink to="/my-bookings"     label="My Bookings"     onClick={() => setDropdownOpen(false)} />
                        <DropdownLink to="/my-consultation" label="My Consultation" onClick={() => setDropdownOpen(false)} />
                        <DropdownLink to="/my-reviews"      label="My Reviews"      onClick={() => setDropdownOpen(false)} />

                        {/* Support group */}
                        <div className="mt-1" style={{ borderTop: '1px solid rgba(212,175,55,0.08)' }}>
                          <DropdownSection label="Support" />
                          <DropdownLink to="/messages"           label="Messages"           onClick={() => setDropdownOpen(false)} />
                          <DropdownLink to="/referrals"          label="Referrals"          onClick={() => setDropdownOpen(false)} />
                          <DropdownLink to="/before-appointment" label="Before Appointment" onClick={() => setDropdownOpen(false)} />
                          <DropdownLink to="/aftercare"          label="Aftercare Guide"    onClick={() => setDropdownOpen(false)} />
                        </div>
                      </>
                    )}

                    {user.role === 'admin' && (
                      <>
                        <DropdownSection label="Admin" />
                        <DropdownLink to="/admin" label="Admin Dashboard" onClick={() => setDropdownOpen(false)} />
                      </>
                    )}

                    {/* Sign out */}
                    <div className="pb-1.5 mt-1" style={{ borderTop: '1px solid rgba(212,175,55,0.10)' }}>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-[7px] text-[12px] tracking-wide transition-colors duration-150"
                        style={{ color: 'rgba(245,245,245,0.35)' }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = '#f87171';
                          e.currentTarget.style.background = 'rgba(248,113,113,0.05)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = 'rgba(245,245,245,0.35)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
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
            /* Guest */
            <Link
              to="/login"
              className="text-[11px] tracking-[0.14em] uppercase font-medium transition-colors duration-150"
              style={{ color: 'rgba(245,245,245,0.60)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,245,0.60)'}
            >
              Sign In
            </Link>
          )}

          {/* PRIMARY CTA */}
          {!isAdmin && (
            <Link
              to="/my-consultation"
              className="flex-shrink-0 text-[11px] font-semibold tracking-[0.15em] uppercase px-5 py-2.5
                         transition-all duration-200"
              style={{
                background: '#D4AF37',
                color:      '#111111',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#c9a430'}
              onMouseLeave={e => e.currentTarget.style.background = '#D4AF37'}
            >
              Start Consultation
            </Link>
          )}
        </div>

        {/* ── Hamburger ── */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2 ml-auto flex-shrink-0"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          <span className={`w-5 h-px transition-all duration-200 ${menuOpen ? 'rotate-45 translate-y-[7px]' : ''}`}
            style={{ background: '#F5F5F5' }} />
          <span className={`w-5 h-px transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`}
            style={{ background: '#F5F5F5' }} />
          <span className={`w-5 h-px transition-all duration-200 ${menuOpen ? '-rotate-45 -translate-y-[7px]' : ''}`}
            style={{ background: '#F5F5F5' }} />
        </button>
      </nav>

      {/* ── Mobile / tablet menu ─────────────────────────────────────────────── */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out
          ${menuOpen ? 'max-h-[90vh] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div
          className="px-6 py-5"
          style={{
            background:           'rgba(18, 18, 18, 0.98)',
            backdropFilter:       'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop:            '1px solid rgba(212, 175, 55, 0.14)',
          }}
        >
          {/* Public nav */}
          {!isAdmin && (
            <nav className="space-y-0.5 mb-5">
              {PUBLIC_NAV.map((item) => (
                <MobileNavItem
                  key={item.to}
                  item={item}
                  active={isAnchorActive(item)}
                  onClose={() => setMenuOpen(false)}
                />
              ))}
            </nav>
          )}

          {/* Account section */}
          <div className="pt-4 space-y-0.5" style={{ borderTop: '1px solid rgba(212,175,55,0.12)' }}>
            {user ? (
              <>
                {/* Identity */}
                <div className="flex items-center gap-3 py-3 mb-1">
                  <Avatar user={user} />
                  <div className="min-w-0">
                    <p className="text-sm truncate" style={{ color: '#F5F5F5' }}>
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(245,245,245,0.28)' }}>
                      {user.email}
                    </p>
                  </div>
                </div>

                {user.role === 'admin' && (
                  <MobileAccountLink to="/admin" label="Admin Dashboard" onClick={() => setMenuOpen(false)} accent />
                )}

                {user.role === 'customer' && (
                  <>
                    <MobileAccountLink
                      to="/dashboard"
                      state={{ tab: 'profile' }}
                      label="My Profile"
                      onClick={() => setMenuOpen(false)}
                      accent
                    />
                    <MobileAccountLink to="/dashboard"          label="My Dashboard"       onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/my-bookings"        label="My Bookings"        onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/my-consultation"    label="My Consultation"    onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/my-reviews"         label="My Reviews"         onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/messages"           label="Messages"           onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/notifications"      label="Notifications"      onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/referrals"          label="Referrals"          onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/before-appointment" label="Before Appointment" onClick={() => setMenuOpen(false)} />
                    <MobileAccountLink to="/aftercare"          label="Aftercare Guide"    onClick={() => setMenuOpen(false)} />
                  </>
                )}

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-xs tracking-[0.12em] uppercase py-2.5 mt-1 transition-colors duration-150"
                  style={{ color: 'rgba(245,245,245,0.35)' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                  onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,245,0.35)'}
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
                className="block text-xs tracking-[0.14em] uppercase py-2.5 transition-colors duration-150"
                style={{ color: 'rgba(245,245,245,0.55)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,245,245,0.55)'}
              >
                Sign In
              </Link>
            )}

            {/* Mobile CTA */}
            {!isAdmin && (
              <div className="pt-4">
                <Link
                  to="/my-consultation"
                  onClick={() => setMenuOpen(false)}
                  className="block text-center text-[11px] font-semibold tracking-[0.15em] uppercase py-3
                             transition-all duration-200"
                  style={{ background: '#D4AF37', color: '#111111' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#c9a430'}
                  onMouseLeave={e => e.currentTarget.style.background = '#D4AF37'}
                >
                  Start Consultation
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ── Mobile NavItem — handles anchor + route ───────────────────────────────────
function MobileNavItem({ item, active, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = (e) => {
    if (item.type === 'anchor') {
      e.preventDefault();
      const hash = item.to.replace('/', '');
      onClose();
      if (location.pathname === '/') {
        const el = document.querySelector(hash);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        navigate('/' + hash);
      }
    } else {
      onClose();
    }
  };

  const activeCls = 'text-xs tracking-[0.14em] uppercase font-medium block py-2.5 transition-colors duration-150';

  if (item.type === 'anchor') {
    return (
      <a
        href={item.to}
        onClick={handleClick}
        className={activeCls}
        style={{ color: active ? '#D4AF37' : 'rgba(245,245,245,0.55)' }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#D4AF37'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.color = 'rgba(245,245,245,0.55)'; }}
      >
        {item.label}
      </a>
    );
  }

  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      onClick={onClose}
      className={activeCls}
      style={({ isActive }) => ({ color: isActive ? '#D4AF37' : 'rgba(245,245,245,0.55)' })}
    >
      {item.label}
    </NavLink>
  );
}

// ── Mobile account link ───────────────────────────────────────────────────────
function MobileAccountLink({ to, state, label, onClick, accent }) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      className="block text-xs tracking-[0.12em] uppercase py-2 transition-colors duration-150"
      style={{ color: accent ? 'rgba(212,175,55,0.80)' : 'rgba(245,245,245,0.55)' }}
      onMouseEnter={e => e.currentTarget.style.color = '#D4AF37'}
      onMouseLeave={e => e.currentTarget.style.color = accent ? 'rgba(212,175,55,0.80)' : 'rgba(245,245,245,0.55)'}
    >
      {label}
    </Link>
  );
}

export default Navbar;
