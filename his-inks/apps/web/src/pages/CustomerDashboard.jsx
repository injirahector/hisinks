import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import ReviewModal from '../components/ReviewModal';
import ImageLightbox from '../components/ImageLightbox';

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCENT = '#C49A44';

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const PIE_COLORS = [
  '#C49A44', '#e8c87a', '#8a6420', '#d4b060',
  '#f0d898', '#6e4e10', '#b08030',
];

const STATUS_STYLES = {
  pending: {
    text: 'text-amber-400',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    dot: 'bg-amber-400',
    label: 'Pending',
  },
  confirmed: {
    text: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/30',
    dot: 'bg-blue-400',
    label: 'Confirmed',
  },
  completed: {
    text: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    dot: 'bg-emerald-400',
    label: 'Completed',
  },
  cancelled: {
    text: 'text-red-400',
    bg: 'bg-red-400/10',
    border: 'border-red-400/30',
    dot: 'bg-red-400',
    label: 'Cancelled',
  },
};

const TABS = [
  { id: 'overview',      label: 'Overview' },
  { id: 'bookings',      label: 'Bookings' },
  { id: 'reviews',       label: 'Reviews' },
  { id: 'messages',      label: 'Messages' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'profile',       label: 'Profile' },
  { id: 'charts',        label: 'Charts' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d)) return '—';
  return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

function fmtKsh(amount) {
  if (amount == null || isNaN(amount)) return 'KSh —';
  return `KSh ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtRelative(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d)) return '';
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  const diffYears = Math.floor(diffDays / 365);
  return `${diffYears}y ago`;
}

// ─── Shared Components ────────────────────────────────────────────────────────

function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse rounded bg-white/8 ${className}`} />
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

function EmptyState({ icon, title = 'Nothing here yet', desc = '', action }) {
  const defaultIcon = (
    <svg
      className="mx-auto mb-4 h-12 w-12 text-white/15"
      fill="none"
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="28" width="8" height="16" rx="2" fill="currentColor" opacity="0.6" />
      <rect x="16" y="18" width="8" height="26" rx="2" fill="currentColor" opacity="0.8" />
      <rect x="28" y="10" width="8" height="34" rx="2" fill="currentColor" />
      <rect x="40" y="22" width="8" height="22" rx="2" fill="currentColor" opacity="0.7" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ?? defaultIcon}
      <p className="mb-1 font-display text-lg text-white/60">{title}</p>
      {desc && <p className="mb-4 max-w-xs text-sm text-white/35">{desc}</p>}
      {action && (
        <div className="mt-2">{action}</div>
      )}
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
      <svg className="h-4 w-4 shrink-0 text-red-400" fill="none" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 6v4m0 3.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p className="flex-1 text-sm text-red-300">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 rounded-md border border-red-500/40 px-3 py-1 text-xs text-red-300 transition hover:bg-red-500/20"
        >
          Retry
        </button>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.text} ${s.bg} ${s.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function Stars({ rating = 0, size = 'sm' }) {
  const dim = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <svg
            key={i}
            className={`${dim} shrink-0`}
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {half ? (
              <>
                <defs>
                  <linearGradient id={`half-${i}`} x1="0" x2="1" y1="0" y2="0">
                    <stop offset="50%" stopColor={ACCENT} />
                    <stop offset="50%" stopColor="transparent" />
                  </linearGradient>
                </defs>
                <path
                  d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z"
                  fill={`url(#half-${i})`}
                  stroke={ACCENT}
                  strokeWidth="1"
                />
              </>
            ) : (
              <path
                d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z"
                fill={filled ? ACCENT : 'transparent'}
                stroke={filled ? ACCENT : 'rgba(255,255,255,0.2)'}
                strokeWidth="1"
              />
            )}
          </svg>
        );
      })}
    </span>
  );
}

function StatCard({ icon, label, value, sub, accent = false, loading = false }) {
  if (loading) return <CardSkeleton />;
  return (
    <div
      className={[
        'group relative rounded-xl border p-5 transition-all duration-300',
        'hover:shadow-lg hover:shadow-brand-accent/5',
        accent
          ? 'border-brand-accent/25 bg-brand-accent/5 hover:border-brand-accent/40'
          : 'border-white/8 bg-white/3 hover:border-brand-accent/30',
      ].join(' ')}
    >
      {/* Icon – top right */}
      {icon && (
        <div
          className={[
            'absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-brand-accent',
            accent ? 'bg-brand-accent/15' : 'bg-white/5',
          ].join(' ')}
        >
          {icon}
        </div>
      )}

      <p className="mb-1 text-xs uppercase tracking-widest text-white/40">{label}</p>
      <p className="font-display text-3xl font-semibold text-white">{value ?? '—'}</p>
      {sub && <p className="mt-1 text-xs text-white/35">{sub}</p>}
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs uppercase tracking-[0.3em] text-brand-accent">
            {eyebrow}
          </p>
        )}
        <h2 className="font-display text-2xl font-semibold text-white">{title}</h2>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function TabBar({ tabs = [], active, onChange }) {
  return (
    <div className="relative">
      {/* Bottom border line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/8" />

      <div
        className="flex overflow-x-auto scrollbar-hide"
        role="tablist"
        aria-label="Dashboard tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange?.(tab.id)}
              className={[
                'relative shrink-0 px-4 py-2.5 text-xs uppercase tracking-widest transition-colors duration-200 focus:outline-none',
                isActive
                  ? 'border-b-2 border-brand-accent text-brand-accent'
                  : 'border-b-2 border-transparent text-white/35 hover:text-white/70',
              ].join(' ')}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-lg border border-white/12 bg-[#141414] px-3 py-2.5 shadow-xl">
      {label != null && (
        <p className="mb-1.5 text-[10px] uppercase tracking-widest text-white/40">{label}</p>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((entry, i) => {
          const displayValue = formatter
            ? formatter(entry.value, entry.name)
            : entry.value;
          return (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color ?? ACCENT }}
              />
              <span className="text-xs text-white/50">{entry.name}</span>
              <span className="ml-auto pl-3 text-xs font-bold text-white">
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}



// ─── Quick Actions ────────────────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    {
      label: 'Book New Tattoo',
      to: '/book',
      icon: (
        <svg className="w-6 h-6 text-brand-accent/60 group-hover:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
        </svg>
      ),
    },
    {
      label: 'Browse Gallery',
      to: '/portfolio',
      icon: (
        <svg className="w-6 h-6 text-brand-accent/60 group-hover:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
    },
    {
      label: 'Contact Artist',
      to: '/messages',
      icon: (
        <svg className="w-6 h-6 text-brand-accent/60 group-hover:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
      ),
    },
    {
      label: 'View Bookings',
      to: '/my-bookings',
      icon: (
        <svg className="w-6 h-6 text-brand-accent/60 group-hover:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
        </svg>
      ),
    },
    {
      label: 'My Consultation',
      to: '/my-consultation',
      icon: (
        <svg className="w-6 h-6 text-brand-accent/60 group-hover:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
        </svg>
      ),
    },
    {
      label: 'My Reviews',
      to: '/my-reviews',
      icon: (
        <svg className="w-6 h-6 text-brand-accent/60 group-hover:text-brand-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
      {actions.map(({ label, to, icon }) => (
        <Link
          key={to}
          to={to}
          className="rounded-xl border border-white/8 bg-white/3 p-4 hover:border-brand-accent/30 hover:bg-brand-accent/5 transition-all flex flex-col items-center gap-2 text-center group"
        >
          {icon}
          <span className="text-white/50 text-xs uppercase tracking-widest group-hover:text-white/80 transition-colors leading-tight">
            {label}
          </span>
        </Link>
      ))}
    </div>
  );
}

// ─── Upcoming Appointment Card ────────────────────────────────────────────────
function UpcomingAppointmentCard({ booking, consultation, loading }) {
  if (loading) return <CardSkeleton />;

  const hasConsultationDeposit = consultation?.depositStatus === 'paid';

  if (!booking && !hasConsultationDeposit) {
    return (
      <EmptyState
        title="No Upcoming Appointments"
        desc="You don't have any upcoming bookings yet."
        action={
          <Link
            to="/book"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-brand-accent/40 bg-brand-accent/10 text-brand-accent text-sm hover:bg-brand-accent/20 transition-colors"
          >
            Book an Appointment
          </Link>
        }
      />
    );
  }

  const depositAmount = consultation?.depositAmount ?? 0;
  const totalAmount = booking?.totalAmount ?? consultation?.totalAmount ?? 0;
  const remaining = totalAmount - depositAmount;

  return (
    <div className="border border-brand-accent/30 bg-brand-accent/5 rounded-xl p-6 space-y-4">
      {/* Eyebrow */}
      <p className="text-brand-accent text-xs font-semibold uppercase tracking-[0.3em]">
        Upcoming
      </p>

      {/* Title */}
      <h3 className="font-display text-xl text-white">
        {booking?.tattooIdea || 'Appointment'}
      </h3>

      {/* Details grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Date</p>
          <p className="text-white/80 text-sm">
            {booking?.preferredDate ? fmtDate(booking.preferredDate) : '—'}
          </p>
        </div>
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Placement</p>
          <p className="text-white/80 text-sm">{booking?.placement || '—'}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Size</p>
          <p className="text-white/80 text-sm">{booking?.size || '—'}</p>
        </div>
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Status</p>
          {booking?.status ? <StatusBadge status={booking.status} /> : <span className="text-white/40 text-sm">—</span>}
        </div>
      </div>

      {/* Deposit / balance info */}
      {consultation && (
        <div className="flex flex-wrap gap-4 pt-2 border-t border-white/8">
          {depositAmount > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Deposit Paid</p>
              <p className="text-green-400 text-sm font-semibold">{fmtKsh(depositAmount)}</p>
            </div>
          )}
          {remaining > 0 && (
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Remaining Balance</p>
              <p className="text-yellow-400 text-sm font-semibold">{fmtKsh(remaining)}</p>
            </div>
          )}
        </div>
      )}

      {/* Action row */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Link
          to="/my-bookings"
          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white/70 text-xs hover:border-white/30 hover:text-white transition-colors"
        >
          View Details
        </Link>
        <Link
          to="/my-consultation"
          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white/70 text-xs hover:border-white/30 hover:text-white transition-colors"
        >
          Consult Thread
        </Link>
        <Link
          to="/messages"
          className="px-3 py-1.5 rounded-lg border border-white/15 bg-white/5 text-white/70 text-xs hover:border-white/30 hover:text-white transition-colors"
        >
          Contact Artist
        </Link>
      </div>
    </div>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────
function ActivityTimeline({ bookings, reviews, consultation, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-4 pl-8 relative">
            <div className="absolute left-0 w-6 h-6 rounded-full bg-white/8 animate-pulse" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const events = [];

  // Bookings submitted
  (bookings || []).forEach((b) => {
    events.push({
      type: 'booking',
      date: new Date(b.createdAt),
      text: `Booking submitted: ${b.tattooIdea || 'Tattoo appointment'}`,
      status: b.status,
      icon: '📋',
    });
    // Completed bookings get a separate event
    if (b.status === 'completed') {
      events.push({
        type: 'completed',
        date: new Date(b.updatedAt || b.createdAt),
        text: `Booking completed: ${b.tattooIdea || 'Tattoo appointment'}`,
        status: b.status,
        icon: '🎨',
      });
    }
  });

  // Reviews
  (reviews || []).forEach((r) => {
    events.push({
      type: 'review',
      date: new Date(r.createdAt),
      text: `You left a ${r.rating}★ review`,
      icon: '⭐',
    });
  });

  // Consultation deposit
  if (consultation?.depositStatus === 'paid') {
    events.push({
      type: 'deposit',
      date: new Date(consultation.updatedAt || consultation.createdAt),
      text: `Deposit paid: ${fmtKsh(consultation.depositAmount || 0)}`,
      icon: '💰',
    });
  }

  // Consultation messages (last 3)
  const messages = consultation?.messages || [];
  const lastThreeMessages = messages.slice(-3);
  lastThreeMessages.forEach((msg) => {
    events.push({
      type: 'message',
      date: new Date(msg.createdAt || msg.timestamp),
      text: msg.text || msg.content || 'New consultation message',
      icon: '💬',
    });
  });

  // Sort newest first, take top 8
  events.sort((a, b) => b.date - a.date);
  const topEvents = events.slice(0, 8);

  if (topEvents.length === 0) {
    return (
      <p className="text-white/30 text-sm text-center py-6">
        No recent activity yet.
      </p>
    );
  }

  const dotColors = {
    booking: 'border-brand-accent/40 bg-brand-accent/10',
    completed: 'border-green-500/40 bg-green-500/10',
    review: 'border-yellow-500/40 bg-yellow-500/10',
    message: 'border-blue-500/40 bg-blue-500/10',
    deposit: 'border-green-400/40 bg-green-400/10',
  };

  return (
    <div className="relative space-y-5">
      {/* Vertical line */}
      <div className="absolute left-3 w-px bg-white/8 top-0 bottom-0" />

      {topEvents.map((event, idx) => (
        <div key={idx} className="flex gap-4 pl-8 relative">
          {/* Dot */}
          <div
            className={`absolute left-0 w-6 h-6 rounded-full border flex items-center justify-center text-xs ${dotColors[event.type] || 'border-white/20 bg-white/5'}`}
          >
            {event.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 pb-1">
            <p className="text-white/70 text-sm leading-snug">{event.text}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-white/30 text-xs">{fmtRelative(event.date)}</span>
              {event.status && <StatusBadge status={event.status} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ data, loading }) {
  const { bookings = [], consultation = null, reviews = [], notifications = [] } = data || {};

  const completedCount = bookings.filter((b) => b.status === 'completed').length;
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Find next upcoming booking (confirmed or pending, soonest date)
  const upcomingBookings = bookings
    .filter((b) => b.status === 'confirmed' || b.status === 'pending')
    .sort((a, b) => new Date(a.preferredDate || a.createdAt) - new Date(b.preferredDate || b.createdAt));
  const nextBooking = upcomingBookings[0] || null;

  return (
    <div className="space-y-10">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Total Bookings"
          value={loading ? '—' : bookings.length}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          }
        />
        <StatCard
          label="Completed"
          value={loading ? '—' : completedCount}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          }
        />
        <StatCard
          label="Reviews"
          value={loading ? '—' : reviews.length}
          loading={loading}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          }
        />
        <StatCard
          label="Unread Notifications"
          value={loading ? '—' : unreadCount}
          loading={loading}
          accent={unreadCount > 0}
          icon={
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          }
        />
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <p className="text-brand-accent text-xs tracking-[0.3em] uppercase font-medium">Quick Actions</p>
        <QuickActions />
      </div>

      {/* Upcoming Appointment */}
      <div className="space-y-4">
        <p className="text-brand-accent text-xs tracking-[0.3em] uppercase font-medium">Next Appointment</p>
        <UpcomingAppointmentCard
          booking={nextBooking}
          consultation={consultation}
          loading={loading}
        />
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <p className="text-brand-accent text-xs tracking-[0.3em] uppercase font-medium">Recent Activity</p>
        <ActivityTimeline
          bookings={bookings}
          reviews={reviews}
          consultation={consultation}
          loading={loading}
        />
      </div>
    </div>
  );
}



// ─── BookingsTab ────────────────────────────────────────────────────────────
function BookingCard({ booking, reviewedIds, onReview }) {
  const [open, setOpen] = React.useState(false);
  const reviewed = reviewedIds.has(booking._id || booking.id);

  return (
    <div className="border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-colors">
      {/* Collapsed header */}
      <button
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/3 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-white font-medium truncate">
            {booking.tattooIdea || 'Tattoo Booking'}
          </span>
          <span className="text-white/40 text-xs">
            {[booking.placement, booking.size, fmtDate(booking.preferredDate || booking.createdAt)]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          <StatusBadge status={booking.status} />
          <svg
            className={`w-4 h-4 text-white/40 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded details */}
      {open && (
        <div className="border-t border-white/8 px-5 py-5 space-y-5 bg-white/[0.02]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 text-sm">
            {[
              { label: 'Placement', value: booking.placement },
              { label: 'Size',      value: booking.size },
              { label: 'Date',      value: fmtDate(booking.preferredDate) },
              { label: 'Phone',     value: booking.phone },
              { label: 'Submitted', value: fmtDate(booking.createdAt) },
            ].filter(f => f.value).map(f => (
              <div key={f.label}>
                <p className="text-white/30 text-[10px] uppercase tracking-wider mb-0.5">{f.label}</p>
                <p className="text-white/80">{f.value}</p>
              </div>
            ))}
          </div>

          {booking.notes && (
            <div className="rounded-lg bg-white/4 border border-white/8 px-4 py-3">
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-1">Studio Notes</p>
              <p className="text-white/60 text-sm leading-relaxed">{booking.notes}</p>
            </div>
          )}

          {booking.referenceImage && (
            <div>
              <p className="text-white/30 text-[10px] uppercase tracking-wider mb-2">Reference Image</p>
              <img src={booking.referenceImage} alt="Reference"
                className="h-28 w-auto rounded-xl object-cover border border-white/10" />
            </div>
          )}

          {booking.status === 'completed' && !reviewed && (
            <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-accent/20 bg-brand-accent/5 px-4 py-3">
              <p className="text-white/50 text-sm">How was your session?</p>
              <button
                onClick={() => onReview(booking)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand-accent text-black text-xs font-semibold hover:bg-brand-accent/90 transition-colors flex-shrink-0"
              >
                <span>★</span> Rate Session
              </button>
            </div>
          )}
          {booking.status === 'completed' && reviewed && (
            <p className="text-white/30 text-xs flex items-center gap-1.5">
              <span className="text-brand-accent">★</span> You've reviewed this session.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function BookingsTab({ bookings, loading, onReview }) {
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [page, setPage] = React.useState(1);
  const PAGE_SIZE = 5;

  const reviewedIds = React.useMemo(() => {
    // bookings doesn't carry review info here; we rely on parent passing onReview
    return new Set();
  }, []);

  const filtered = React.useMemo(() => {
    let list = bookings || [];
    if (statusFilter !== 'all') list = list.filter((b) => b.status === statusFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          (b.tattooIdea || '').toLowerCase().includes(q) ||
          (b.placement || '').toLowerCase().includes(q) ||
          (b.status || '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [bookings, statusFilter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Reset page when filters change
  React.useEffect(() => { setPage(1); }, [search, statusFilter]);

  const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="History"
        title="My Bookings"
        action={
          <Link
            to="/book"
            className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/70 text-sm hover:text-white hover:border-white/20 transition-colors"
          >
            + New Booking
          </Link>
        }
      />

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookings…"
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/25 focus:outline-none focus:border-brand-accent/50 transition-colors"
        />
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              statusFilter === s
                ? 'bg-brand-accent/20 border border-brand-accent/40 text-brand-accent'
                : 'border border-white/10 bg-white/5 text-white/50 hover:text-white/80 hover:border-white/20'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          title="No bookings found"
          description={search || statusFilter !== 'all' ? 'Try adjusting your search or filters.' : 'Ready to get started?'}
          action={
            !search && statusFilter === 'all' ? (
              <Link
                to="/book"
                className="px-4 py-2 rounded-lg bg-brand-accent text-black text-sm font-semibold hover:bg-brand-accent/90 transition-colors"
              >
                Book your first tattoo
              </Link>
            ) : null
          }
        />
      )}

      {/* Booking list */}
      {!loading && paginated.length > 0 && (
        <div className="space-y-3">
          {paginated.map((b) => (
            <BookingCard
              key={b._id || b.id}
              booking={b}
              reviewedIds={reviewedIds}
              onReview={onReview}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm disabled:opacity-30 hover:text-white hover:border-white/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Prev
          </button>
          <span className="text-white/30 text-xs">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm disabled:opacity-30 hover:text-white hover:border-white/20 transition-colors"
          >
            Next
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}


// ─── ReviewsTab ─────────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = React.useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          className={`text-2xl transition-colors ${
            n <= (hovered || value) ? 'text-brand-accent' : 'text-white/20'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function StarDisplay({ value }) {
  return (
    <span className="text-brand-accent text-sm">
      {'★'.repeat(value)}
      <span className="text-white/20">{'★'.repeat(5 - value)}</span>
    </span>
  );
}

function ReviewForm({ booking, existingReview, onClose, onSaved }) {
  const [rating, setRating] = React.useState(existingReview?.rating || 0);
  const [title, setTitle] = React.useState(existingReview?.title || '');
  const [comment, setComment] = React.useState(existingReview?.comment || '');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const MAX_COMMENT = 1000;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) { setError('Please select a star rating.'); return; }
    if (!comment.trim()) { setError('Please write a comment.'); return; }
    setSubmitting(true);
    setError('');
    try {
      if (existingReview) {
        await api.patch(`/reviews/${existingReview._id || existingReview.id}`, { rating, title, comment });
      } else {
        await api.post('/reviews', {
          appointment: booking._id || booking.id,
          rating,
          title,
          comment,
        });
      }
      onSaved();
    } catch (err) {
      setError(err.message || 'Failed to save review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-3">
      {/* Star rating */}
      <div>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-2">
          Rating <span className="text-red-400">*</span>
        </p>
        <StarInput value={rating} onChange={setRating} />
      </div>

      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="w-full text-sm border border-white/10 bg-white/5 text-white placeholder-white/25 px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-accent/50 transition-colors"
      />

      {/* Comment */}
      <div className="relative">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, MAX_COMMENT))}
          placeholder="Share your experience…"
          rows={4}
          className="w-full text-sm border border-white/10 bg-white/5 text-white placeholder-white/25 px-4 py-2.5 rounded-xl focus:outline-none focus:border-brand-accent/50 resize-none transition-colors"
        />
        <span className="absolute bottom-3 right-3 text-white/20 text-xs pointer-events-none">
          {comment.length}/{MAX_COMMENT}
        </span>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">{error}</p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-accent text-black text-sm font-semibold hover:bg-brand-accent/90 disabled:opacity-50 transition-colors"
        >
          {submitting && <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />}
          {submitting ? 'Saving…' : existingReview ? 'Update Review' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm hover:text-white hover:border-white/20 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReviewCard({ review, onEdit, onDelete }) {
  return (
    <div className="border border-white/8 rounded-xl p-5 space-y-3 hover:border-white/15 transition-colors bg-white/[0.02]">
      {/* Header row */}
      <div className="flex items-start justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Stars rating={review.rating} size="md" />
          <span className="text-white/40 text-xs font-medium">{review.rating}/5</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
            review.isVisible !== false
              ? 'border-green-500/30 bg-green-500/10 text-green-400'
              : 'border-white/10 bg-white/5 text-white/35'
          }`}>
            {review.isVisible !== false ? 'Visible' : 'Hidden'}
          </span>
          <span className="text-white/25 text-xs">{fmtDate(review.createdAt)}</span>
        </div>
      </div>

      {review.title && (
        <p className="text-white font-medium text-sm">{review.title}</p>
      )}

      {(review.appointment?.tattooIdea || review.bookingName) && (
        <p className="text-white/30 text-xs">
          For: {review.appointment?.tattooIdea || review.bookingName}
        </p>
      )}

      <p className="text-white/60 text-sm leading-relaxed">{review.comment}</p>

      {review.artistReply && (
        <div className="rounded-xl border border-brand-accent/20 bg-brand-accent/5 px-4 py-3">
          <p className="text-brand-accent text-[10px] uppercase tracking-widest mb-1">Studio Reply</p>
          <p className="text-white/60 text-sm leading-relaxed">{review.artistReply}</p>
        </div>
      )}

      <div className="flex gap-2 pt-1 border-t border-white/6">
        <button
          onClick={() => onEdit(review)}
          className="px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white/50 text-xs hover:text-white hover:border-white/20 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(review)}
          className="px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400/60 text-xs hover:text-red-400 hover:border-red-500/40 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function ReviewsTab({ reviews, bookings, loading, onReload }) {
  const [editingReview, setEditingReview] = React.useState(null); // null | review object
  const [openFormForBooking, setOpenFormForBooking] = React.useState(null); // null | booking object
  const [deleteError, setDeleteError] = React.useState('');

  const reviewedBookingIds = React.useMemo(
    () => new Set((reviews || []).map((r) => r.bookingId || r.booking)),
    [reviews],
  );

  const eligibleBookings = React.useMemo(
    () =>
      (bookings || []).filter(
        (b) => b.status === 'completed' && !reviewedBookingIds.has(b._id || b.id),
      ),
    [bookings, reviewedBookingIds],
  );

  const handleDelete = async (review) => {
    if (!window.confirm('Are you sure you want to delete this review? This cannot be undone.')) return;
    setDeleteError('');
    try {
      await api.delete(`/reviews/${review._id || review.id}`);
      onReload();
    } catch {
      setDeleteError('Failed to delete review. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Reputation" title="My Reviews" />

      {/* Skeletons */}
      {loading && (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 animate-pulse rounded-xl" />
          ))}
        </div>
      )}

      {/* Ready to Review */}
      {!loading && eligibleBookings.length > 0 && (
        <div className="border border-dashed border-white/15 rounded-xl p-5 space-y-3">
          <p className="text-white/50 text-xs uppercase tracking-wider">Ready to Review</p>
          {eligibleBookings.map((b) => (
            <div key={b._id || b.id} className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-white/80 text-sm font-medium">{b.tattooIdea || 'Tattoo Session'}</p>
                  <p className="text-white/30 text-xs">{fmtDate(b.preferredDate || b.createdAt)}</p>
                </div>
                <button
                  onClick={() =>
                    setOpenFormForBooking((prev) =>
                      prev?._id === b._id ? null : b,
                    )
                  }
                  className="px-3 py-1.5 rounded-lg border border-brand-accent/30 bg-brand-accent/10 text-brand-accent text-xs font-medium hover:bg-brand-accent/20 transition-colors"
                >
                  Write Review
                </button>
              </div>
              {openFormForBooking && (openFormForBooking._id || openFormForBooking.id) === (b._id || b.id) && (
                <ReviewForm
                  booking={b}
                  existingReview={null}
                  onClose={() => setOpenFormForBooking(null)}
                  onSaved={() => { setOpenFormForBooking(null); onReload(); }}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Inline edit form */}
      {editingReview && (
        <div className="border border-brand-accent/20 rounded-xl p-5 bg-brand-accent/5">
          <p className="text-brand-accent text-xs uppercase tracking-wider mb-3">Editing Review</p>
          <ReviewForm
            booking={{ _id: editingReview.bookingId || editingReview.booking }}
            existingReview={editingReview}
            onClose={() => setEditingReview(null)}
            onSaved={() => { setEditingReview(null); onReload(); }}
          />
        </div>
      )}

      {deleteError && <p className="text-red-400 text-sm">{deleteError}</p>}

      {/* Reviews list */}
      {!loading && (reviews || []).length === 0 && eligibleBookings.length === 0 && (
        <EmptyState
          title="No reviews yet"
          description="Complete a booking to leave your first review."
        />
      )}

      {!loading && (reviews || []).length > 0 && (
        <div className="space-y-4">
          {reviews.map((r) => (
            <ReviewCard
              key={r._id || r.id}
              review={r}
              onEdit={(rev) => { setEditingReview(rev); setOpenFormForBooking(null); }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// ─── MessagesTab ─────────────────────────────────────────────────────────────
function MessagesTab({ loading: parentLoading }) {
  // thread: false=loading, null=no thread, object=thread data
  const [thread, setThread] = React.useState(false);
  const [text, setText] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [imageFile, setImageFile] = React.useState(null);
  const [imagePreview, setImagePreview] = React.useState(null);
  const [lightbox, setLightbox] = React.useState(null);
  const [fetchError, setFetchError] = React.useState('');
  const [sendError, setSendError] = React.useState('');

  const bottomRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const textareaRef = React.useRef(null);

  // Fetch thread on mount
  React.useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setFetchError('');
      try {
        const res = await api.get('/messages/my');
        if (!cancelled) {
          const thread = res.data.data?.thread ?? null;
          setThread(thread);
          if (thread && thread.unreadByCustomer > 0) {
            api.patch('/messages/my/read').catch(() => {});
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError('Could not load messages.');
          setThread(null);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages]);

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  };

  const handleSend = async () => {
    if (!text.trim() && !imageFile) return;
    setSending(true);
    setSendError('');
    try {
      let imageUrl = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append('image', imageFile);
        const uploadRes = await api.post('/uploads/image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = uploadRes.data.data?.url;
      }
      const res = await api.post('/messages/my', {
        text: text.trim() || undefined,
        image: imageUrl || undefined,
      });
      setThread(res.data.data?.thread ?? null);
      setText('');
      setImageFile(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch {
      setSendError('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const messages = thread && thread !== false ? (thread.messages || []) : [];

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Direct" title="Messages" />

      {fetchError && (
        <p className="text-red-400 text-sm border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3">
          {fetchError}
        </p>
      )}

      {/* Chat window */}
      <div className="border border-white/8 rounded-xl overflow-hidden">
        {/* Messages area */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-3 bg-white/2">
          {thread === false && (
            <div className="flex items-center justify-center h-full">
              <div className="w-6 h-6 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
            </div>
          )}

          {thread !== false && messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <svg className="w-10 h-10 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              <p className="text-white/30 text-sm">Send your first message</p>
            </div>
          )}

          {thread !== false && messages.map((msg, i) => {
            const isCustomer = msg.senderRole === 'customer' || msg.sender === 'customer';
            return (
              <div key={msg._id || msg.id || i} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-xl border px-3 py-2 space-y-1 ${
                    isCustomer
                      ? 'bg-brand-accent/15 border-brand-accent/20'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/30 text-xs font-medium">
                      {isCustomer ? 'You' : 'Studio'}
                    </span>
                    <span className="text-white/20 text-xs">{fmtDate(msg.createdAt)}</span>
                  </div>
                  {(msg.text || msg.message) && (
                    <p className="text-white/80 text-sm leading-relaxed whitespace-pre-wrap">{msg.text || msg.message}</p>
                  )}
                  {(msg.imageUrl || msg.image) && (
                    <button
                      onClick={() => setLightbox(msg.imageUrl || msg.image)}
                      className="block mt-1"
                    >
                      <img
                        src={msg.imageUrl || msg.image}
                        alt="Attachment"
                        className="max-h-40 rounded-lg object-cover border border-white/10 hover:opacity-80 transition-opacity"
                      />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Image preview strip */}
        {imagePreview && (
          <div className="px-4 py-2 border-t border-white/8 bg-white/3 flex items-center gap-3">
            <img src={imagePreview} alt="Preview" className="h-12 w-12 object-cover rounded-lg border border-white/10" />
            <span className="text-white/40 text-xs flex-1 truncate">{imageFile?.name}</span>
            <button
              onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
              className="text-white/30 hover:text-white/70 text-lg leading-none"
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {/* Input row */}
        <div className="border-t border-white/8 px-3 py-3 flex items-end gap-2 bg-white/2">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageSelect}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="shrink-0 p-2 rounded-lg border border-white/10 bg-white/5 text-white/40 hover:text-white/70 hover:border-white/20 transition-colors"
            aria-label="Attach image"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 text-sm border border-white/10 bg-white/5 text-white placeholder-white/25 px-3 py-2 rounded-lg focus:outline-none focus:border-white/20 resize-none leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />

          <button
            type="button"
            onClick={handleSend}
            disabled={sending || (!text.trim() && !imageFile)}
            className="shrink-0 px-4 py-2 rounded-lg bg-brand-accent text-black text-sm font-semibold disabled:opacity-40 hover:bg-brand-accent/90 transition-colors"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>

      {sendError && (
        <p className="text-red-400 text-sm border border-red-500/20 bg-red-500/5 rounded-xl px-4 py-3">
          {sendError}
        </p>
      )}

      {/* Image lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setLightbox(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 border border-white/20 text-white/70 hover:text-white flex items-center justify-center text-lg"
              aria-label="Close lightbox"
            >
              ×
            </button>
            <img src={lightbox} alt="Full size attachment" className="w-full rounded-xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}
    </div>
  );
}



/* ── NotificationsTab ─────────────────────────────────────────── */
function NotificationsTab({ notifications, loading, unreadCount, onMarkRead, onMarkAllRead }) {
  const navigate = useNavigate();

  function relativeTime(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  function handleClick(n) {
    if (!n.read) onMarkRead(n._id || n.id);
    if (n.link) navigate(n.link);
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Updates"
        title="Notifications"
        action={
          unreadCount > 0 ? (
            <button
              onClick={onMarkAllRead}
              className="text-sm text-brand-accent hover:text-brand-accent/80 transition-colors"
            >
              Mark all read
            </button>
          ) : null
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={
            <svg className="w-10 h-10 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          }
          title="All caught up"
          description="No notifications yet."
        />
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/30 uppercase tracking-widest font-medium px-1">Unread</p>
              {unread.map((n) => (
                <div
                  key={n._id || n.id}
                  onClick={() => handleClick(n)}
                  className="relative flex gap-4 p-4 border border-white/12 bg-white/3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors"
                >
                  {/* Unread dot */}
                  <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-brand-accent" />
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-white text-sm font-medium truncate">{n.title}</p>
                    {n.message && <p className="text-white/45 text-sm mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-white/20 text-xs mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {read.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-white/30 uppercase tracking-widest font-medium px-1">Earlier</p>
              {read.map((n) => (
                <div
                  key={n._id || n.id}
                  onClick={() => handleClick(n)}
                  className="relative flex gap-4 p-4 border border-white/6 rounded-xl cursor-pointer hover:bg-white/3 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white/50 text-sm font-medium truncate">{n.title}</p>
                    {n.message && <p className="text-white/45 text-sm mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-white/20 text-xs mt-1">{relativeTime(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ProfileTab ───────────────────────────────────────────────── */
function ProfileTab({ user, onUpdate }) {
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    location: user?.location || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileRef = useRef(null);

  // Keep form in sync if user prop changes
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        location: user.location || '',
      });
    }
  }, [user]);

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const uploadRes = await api.post('/uploads/image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url = uploadRes.data.data?.url;
      const patchRes = await api.patch('/users/me', { profileImage: url });
      onUpdate?.(patchRes.data.data?.user);
    } catch (err) {
      setError(err.message || 'Photo upload failed');
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    const changes = {};
    const original = {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      bio: user?.bio || '',
      location: user?.location || '',
    };
    Object.keys(form).forEach((k) => {
      if (form[k] !== original[k]) changes[k] = form[k];
    });

    if (Object.keys(changes).length === 0) {
      setSaving(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      return;
    }

    try {
      const res = await api.patch('/users/me', changes);
      onUpdate?.(res.data.data?.user);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  }

  const initials = `${form.firstName?.[0] || ''}${form.lastName?.[0] || ''}`.toUpperCase() || '?';

  const inputClass =
    'w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-accent rounded-lg transition-colors';

  return (
    <div className="space-y-8 max-w-2xl">
      <SectionHeader eyebrow="Account" title="My Profile" />

      {/* Photo section */}
      <div className="flex items-center gap-5">
        <div className="w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-brand-accent/20 flex items-center justify-center">
              <span className="text-brand-accent font-display text-xl">{initials}</span>
            </div>
          )}
        </div>
        <div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploadingPhoto}
            className="flex items-center gap-2 text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/20 px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {uploadingPhoto ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
              </svg>
            )}
            Change Photo
          </button>
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wide">First Name</label>
            <input
              required
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              placeholder="First name"
              className={inputClass}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wide">Last Name</label>
            <input
              required
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              placeholder="Last name"
              className={inputClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-wide">Email</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="your@email.com"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-wide">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="+1 (555) 000-0000"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-white/40 uppercase tracking-wide">Location</label>
          <input
            value={form.location}
            onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
            placeholder="City, State"
            className={inputClass}
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-white/40 uppercase tracking-wide">Bio</label>
            <span className="text-xs text-white/25">{form.bio.length}/500</span>
          </div>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value.slice(0, 500) }))}
            placeholder="Tell us a little about yourself..."
            rows={4}
            maxLength={500}
            className={`${inputClass} resize-none`}
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}
        {success && <p className="text-green-400 text-sm">Profile saved successfully!</p>}

        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">
          {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </form>

      {/* ── Danger Zone ──────────────────────────────────────────────── */}
      <div className="mt-10 rounded-xl border border-red-500/30 bg-red-500/5 p-6">
        <div className="flex items-center gap-2 mb-1">
          {/* warning icon */}
          <svg className="h-4 w-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
          <p className="text-xs uppercase tracking-[0.3em] text-red-400 font-medium">Danger Zone</p>
        </div>

        <h3 className="font-display text-lg text-white mb-1">Delete Account</h3>
        <p className="text-sm text-white/45 mb-5 max-w-lg">
          Permanently delete your His&nbsp;Inks account and remove your personal information.
          Historical booking and transaction records may be retained where required.
          This action <span className="text-red-400 font-medium">cannot be undone</span>.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="inline-flex items-center gap-2 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2.5 text-sm text-red-400 transition-colors hover:bg-red-500/20 hover:border-red-500/70 focus:outline-none focus:ring-2 focus:ring-red-500/40"
        >
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
          Delete Account
        </button>
      </div>

      {/* ── Delete Account Modal ─────────────────────────────────────── */}
      {showDeleteModal && (
        <DeleteAccountModal
          user={user}
          onClose={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}

/* ── DeleteAccountModal ───────────────────────────────────────── */
function DeleteAccountModal({ user, onClose }) {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const isGoogleOnly = user?.authProvider === 'google' && !user?.hasPassword;

  const [confirmation, setConfirmation] = useState('');
  const [password,     setPassword]     = useState('');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');

  // Lock body scroll while modal is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const canSubmit =
    confirmation === 'DELETE' &&
    !submitting &&
    (isGoogleOnly || password.length > 0);

  async function handleDelete() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const body = { confirmation };
      if (!isGoogleOnly) body.password = password;

      await api.delete('/auth/account', { data: body });

      // Clear client-side auth state (removes token from localStorage + clears user)
      await logout();

      // Navigate to home with a success flag so the landing page can show a toast
      navigate('/', { replace: true, state: { accountDeleted: true } });
    } catch (err) {
      const msg = err.message || 'Unable to delete your account right now. Please try again later.';
      setError(msg);
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-brand-accent rounded-lg transition-colors';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-red-500/25 bg-[#141414] shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 border border-red-500/30">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
            </div>
            <div>
              <h2 id="delete-modal-title" className="font-display text-lg text-white">Delete your account?</h2>
              <p className="text-xs text-white/35 mt-0.5">This action is permanent and cannot be undone.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-white/30 hover:text-white/70 hover:bg-white/8 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {/* What happens notice */}
          <div className="rounded-lg border border-white/8 bg-white/3 px-4 py-3 space-y-1.5 text-sm text-white/50">
            <p className="font-medium text-white/70">What happens when you delete your account:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your personal information will be removed or anonymized.</li>
              <li>Historical booking and transaction records are retained where required.</li>
              <li>You will be immediately logged out.</li>
              <li>You will not be able to log back in with this account.</li>
            </ul>
          </div>

          {/* Confirmation input */}
          <div className="space-y-1.5">
            <label htmlFor="delete-confirmation" className="text-xs text-white/40 uppercase tracking-wide">
              Type <span className="font-mono text-red-400 font-semibold">DELETE</span> to confirm
            </label>
            <input
              id="delete-confirmation"
              type="text"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              spellCheck={false}
              className={`${inputClass} ${confirmation === 'DELETE' ? 'border-red-500/50' : ''}`}
            />
          </div>

          {/* Password input — only for local / non-Google-only accounts */}
          {!isGoogleOnly && (
            <div className="space-y-1.5">
              <label htmlFor="delete-password" className="text-xs text-white/40 uppercase tracking-wide">
                Current Password
              </label>
              <input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your current password"
                autoComplete="current-password"
                className={inputClass}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
              <svg className="h-4 w-4 shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 20 20" aria-hidden="true">
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 6v4m0 3.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm text-white/60 hover:text-white hover:border-white/20 transition-colors focus:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting && (
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden="true" />
            )}
            {submitting ? 'Deleting…' : 'Delete Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── ChartsTab ────────────────────────────────────────────────── */
const PIE_STATUS_COLORS = {
  pending: '#facc15',
  confirmed: '#60a5fa',
  completed: '#4ade80',
  cancelled: '#f87171',
};

function ChartsTab({ bookings, reviews, loading }) {
  // Chart 1: Appointments per month
  const appointmentData = useMemo(() => {
    const map = {};
    (Array.isArray(bookings) ? bookings : []).forEach((b) => {
      const d = new Date(b.preferredDate || b.createdAt);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, count }));
  }, [bookings]);

  // Chart 2: Booking status breakdown
  const statusData = useMemo(() => {
    const map = {};
    (Array.isArray(bookings) ? bookings : []).forEach((b) => {
      const s = (b.status || 'pending').toLowerCase();
      map[s] = (map[s] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [bookings]);

  const totalBookings = statusData.reduce((s, d) => s + d.value, 0);

  // Chart 3: Ratings over time
  const ratingData = useMemo(() => {
    const map = {};
    (Array.isArray(reviews) ? reviews : []).forEach((r) => {
      const d = new Date(r.createdAt);
      if (isNaN(d)) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!map[key]) map[key] = { total: 0, count: 0 };
      map[key].total += r.rating || 0;
      map[key].count += 1;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { total, count }]) => ({ month, avg: parseFloat((total / count).toFixed(2)) }));
  }, [reviews]);

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Analytics" title="My Stats" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-white/4 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <SectionHeader eyebrow="Analytics" title="My Stats" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Appointments Per Month */}
        <div className="border border-white/8 rounded-xl p-5 space-y-4">
          <p className="text-sm text-white/60 font-medium">Appointments Per Month</p>
          {appointmentData.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
              }
              title="No data yet"
              description="Book your first appointment."
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={appointmentData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="apptGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  itemStyle={{ color: '#facc15' }}
                />
                <Area type="monotone" dataKey="count" stroke="#facc15" strokeWidth={2} fill="url(#apptGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Chart 2: Booking Status Breakdown */}
        <div className="border border-white/8 rounded-xl p-5 space-y-4">
          <p className="text-sm text-white/60 font-medium">Booking Status Breakdown</p>
          {statusData.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                </svg>
              }
              title="No data yet"
              description="Your bookings will appear here."
            />
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={PIE_STATUS_COLORS[entry.name] || '#888'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                    itemStyle={{ color: 'rgba(255,255,255,0.8)' }}
                    formatter={(value, name) => [value, name.charAt(0).toUpperCase() + name.slice(1)]}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-display text-white">{totalBookings}</span>
                <span className="text-xs text-white/30">total</span>
              </div>
            </div>
          )}
          {/* Legend */}
          {statusData.length > 0 && (
            <div className="flex flex-wrap gap-3 justify-center">
              {statusData.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_STATUS_COLORS[d.name] || '#888' }} />
                  <span className="text-xs text-white/40 capitalize">{d.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 3: My Ratings Over Time */}
        <div className="border border-white/8 rounded-xl p-5 space-y-4">
          <p className="text-sm text-white/60 font-medium">My Ratings Over Time</p>
          {ratingData.length === 0 ? (
            <EmptyState
              icon={
                <svg className="w-8 h-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              }
              title="No reviews yet"
              description="Leave a review after your session."
            />
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={ratingData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <defs>
                  <linearGradient id="ratingGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#facc15" stopOpacity={0.9} />
                    <stop offset="95%" stopColor="#facc15" stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis
                  domain={[0, 5]}
                  tickFormatter={(v) => `${v}⭐`}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  itemStyle={{ color: '#facc15' }}
                  formatter={(v) => [`${v} / 5`, 'Avg Rating']}
                />
                <Bar dataKey="avg" fill="url(#ratingGradient)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── CustomerDashboard (main) ─────────────────────────────────── */
function CustomerDashboard() {
  const { user, loading: authLoading } = useAuth();
  const {
    notifications,
    unreadCount,
    fetchedOnce,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // Data state
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [consultation, setConsultation] = useState(null);
  const [loadingMap, setLoadingMap] = useState({ bookings: true, reviews: true, consultation: true });
  const [errorMap, setErrorMap] = useState({});

  // Review modal
  const [ratingBooking, setRatingBooking] = useState(null);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // Fetch all dashboard data in parallel
  useEffect(() => {
    if (!user) return;

    async function load() {
      const results = await Promise.allSettled([
        api.get('/users/my-bookings').then((r) => r.data.data),
        api.get('/reviews/me').then((r) => r.data.data),
        api.get('/consultations/my').then((r) => r.data.data),
      ]);

      const [bookingsRes, reviewsRes, consultationRes] = results;

      if (bookingsRes.status === 'fulfilled') {
        setBookings(bookingsRes.value?.bookings ?? []);
      } else {
        setErrorMap((m) => ({ ...m, bookings: 'Failed to load bookings' }));
      }

      if (reviewsRes.status === 'fulfilled') {
        setReviews(reviewsRes.value?.reviews ?? []);
      } else {
        setErrorMap((m) => ({ ...m, reviews: 'Failed to load reviews' }));
      }

      if (consultationRes.status === 'fulfilled') {
        setConsultation(consultationRes.value?.consultation ?? null);
      } else {
        setErrorMap((m) => ({ ...m, consultation: 'Failed to load consultation' }));
      }

      setLoadingMap({ bookings: false, reviews: false, consultation: false });
    }

    load();
  }, [user]);

  // Fetch notifications if not already fetched
  useEffect(() => {
    if (!fetchedOnce) {
      fetchNotifications?.();
    }
  }, [fetchedOnce, fetchNotifications]);

  // Callback to refresh user in auth context (or just trigger a re-fetch)
  function handleProfileUpdate(updatedUser) {
    // If auth context exposes a setUser or refresh, call it here.
    // For now we rely on the local form re-render via the parent re-mount,
    // but many auth contexts expose a refresh method:
    if (typeof window !== 'undefined') {
      // Soft reload user context if available; otherwise no-op.
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-accent/30 border-t-brand-accent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const dataLoading = loadingMap.bookings || loadingMap.reviews;

  return (
    <div className="pt-20 pb-24 min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Welcome banner ─────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/8 bg-gradient-to-br from-brand-accent/8 via-white/3 to-transparent mb-8 px-6 py-8 sm:px-8">
          {/* Decorative glow */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-accent/10 blur-3xl" />

          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            {/* Left: avatar + greeting */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-brand-accent/20 border-2 border-brand-accent/40 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {user.profileImage ? (
                  <img src={user.profileImage} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-display text-xl text-brand-accent">
                    {`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <p className="text-brand-accent text-xs tracking-[0.3em] uppercase mb-1">Welcome back</p>
                <h1 className="font-display text-2xl sm:text-3xl text-white leading-tight">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-white/35 text-sm mt-0.5">{user.email}</p>
              </div>
            </div>

            {/* Right: quick stats strip */}
            <div className="flex items-center gap-6 sm:gap-8 border-t border-white/8 sm:border-t-0 sm:border-l sm:border-white/8 pt-4 sm:pt-0 sm:pl-8">
              <div className="text-center">
                <p className="font-display text-2xl text-white">{bookings.length}</p>
                <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Bookings</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-white">
                  {bookings.filter(b => b.status === 'completed').length}
                </p>
                <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Completed</p>
              </div>
              <div className="text-center">
                <p className="font-display text-2xl text-white">{reviews.length}</p>
                <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Reviews</p>
              </div>
              {unreadCount > 0 && (
                <div className="text-center">
                  <p className="font-display text-2xl text-brand-accent">{unreadCount}</p>
                  <p className="text-white/30 text-xs uppercase tracking-widest mt-0.5">Unread</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="sticky top-16 z-30 bg-brand-bg/95 backdrop-blur-sm pb-px">
          <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Tab content */}
        <div className="mt-8 pb-4">
          {activeTab === 'overview' && (
            <OverviewTab
              bookings={bookings}
              reviews={reviews}
              consultation={consultation}
              loading={dataLoading}
              unreadCount={unreadCount}
              onTabChange={setActiveTab}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsTab
              bookings={bookings}
              loading={loadingMap.bookings}
              reviews={reviews}
              onReview={setRatingBooking}
            />
          )}

          {activeTab === 'reviews' && (
            <ReviewsTab
              reviews={reviews}
              bookings={bookings}
              loading={loadingMap.reviews}
              onReviewAdded={(newReview) => setReviews((prev) => [newReview, ...prev])}
              onReviewUpdated={(updated) =>
                setReviews((prev) => prev.map((r) => (r._id === updated._id ? updated : r)))
              }
              onReviewDeleted={(id) =>
                setReviews((prev) => prev.filter((r) => r._id !== id))
              }
            />
          )}

          {activeTab === 'messages' && <MessagesTab />}

          {activeTab === 'notifications' && (
            <NotificationsTab
              notifications={notifications || []}
              loading={!fetchedOnce}
              unreadCount={unreadCount}
              onMarkRead={markAsRead}
              onMarkAllRead={markAllAsRead}
            />
          )}

          {activeTab === 'profile' && (
            <ProfileTab user={user} onUpdate={handleProfileUpdate} />
          )}

          {activeTab === 'charts' && (
            <ChartsTab
              bookings={bookings}
              reviews={reviews}
              loading={dataLoading}
            />
          )}
        </div>
      </div>

      {/* Review modal */}
      {ratingBooking && (
        <ReviewModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSubmitted={(newReview) => {
            setReviews((prev) => [newReview, ...prev]);
            setRatingBooking(null);
          }}
        />
      )}
    </div>
  );
}

export default CustomerDashboard;