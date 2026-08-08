import { useCallback, useEffect, useState } from 'react';
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../../services/api';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const ACCENT    = '#C49A44';
const MONTHS    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Richer gold-toned palette for pie/doughnut slices
const PIE_COLORS = ['#C49A44','#e8c87a','#8a6420','#d4b060','#f0d898','#6e4e10','#b08030'];

// Status colour map
const STATUS_COLORS = {
  pending:   { text: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400', hex: '#facc15' },
  confirmed: { text: 'text-blue-400',   bg: 'bg-blue-400/10',   dot: 'bg-blue-400',   hex: '#60a5fa' },
  completed: { text: 'text-green-400',  bg: 'bg-green-400/10',  dot: 'bg-green-400',  hex: '#4ade80' },
  cancelled: { text: 'text-red-400',    bg: 'bg-red-400/10',    dot: 'bg-red-400',    hex: '#f87171' },
};

// Doughnut colours keyed to status for the booking pie
const PIE_STATUS_COLORS = {
  pending:   '#facc15',
  confirmed: '#60a5fa',
  completed: '#4ade80',
  cancelled: '#f87171',
};

const ACTIVITY_ICONS = {
  booking_created:    { emoji: '📋', color: 'text-blue-400'   },
  booking_confirmed:  { emoji: '✅', color: 'text-green-400'  },
  booking_completed:  { emoji: '🎨', color: 'text-brand-accent' },
  review_submitted:   { emoji: '⭐', color: 'text-yellow-400' },
  deposit_paid:       { emoji: '💰', color: 'text-green-400'  },
  consultation_opened:{ emoji: '💬', color: 'text-purple-400' },
};

const DATE_PRESETS = [
  { label: '7d',   days: 7   },
  { label: '30d',  days: 30  },
  { label: '90d',  days: 90  },
  { label: '1y',   days: 365 },
  { label: 'All',  days: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────────────────────────────────────
const fmtKsh  = (n) => `KSh ${(n ?? 0).toLocaleString()}`;
const fmtPct  = (n) => `${n > 0 ? '+' : ''}${n}%`;
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
const fmtTime = (d) =>
  new Date(d).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

function buildDateRange(days) {
  if (!days) return {};
  const end   = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate:   end.toISOString().split('T')[0],
  };
}

function monthLabel(year, month) {
  return `${MONTHS[month - 1]} ${String(year).slice(2)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Skeleton block
// ─────────────────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-white/8 rounded ${className}`} />;
}

function CardSkeleton() {
  return (
    <div className="border border-white/8 bg-white/3 rounded-lg p-5 space-y-3">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-2 w-20" />
    </div>
  );
}

function ChartSkeleton({ height = 220 }) {
  return (
    <div className="border border-white/8 bg-white/3 rounded-lg p-5">
      <Skeleton className="h-4 w-32 mb-4" />
      <Skeleton style={{ height }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Error state
// ─────────────────────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      </div>
      <p className="text-white/60 text-sm mb-4">{message || 'Failed to load data.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs uppercase tracking-widest border border-brand-accent/40
                     text-brand-accent hover:bg-brand-accent/10 transition-colors rounded"
        >
          Retry
        </button>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty state
// ─────────────────────────────────────────────────────────────────────────────
function EmptyState({ label = 'No data yet' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <svg className="w-10 h-10 text-white/15 mb-3" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
      <p className="text-white/25 text-sm">{label}</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sparkline (tiny 7-day inline chart with area fill)
// ─────────────────────────────────────────────────────────────────────────────
function Sparkline({ data = [], color = ACCENT }) {
  if (!data || data.length === 0) return <div className="h-8 w-20" />;
  const points = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width={80} height={32}>
      <AreaChart data={points} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0}   />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill="url(#sparkGrad)" dot={false}
          isAnimationActive animationDuration={800} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card
// ─────────────────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, change, spark, accent, loading }) {
  if (loading) return <CardSkeleton />;
  const isPos = change > 0;
  const isNeg = change < 0;
  return (
    <div className={`border rounded-lg p-5 flex flex-col justify-between min-h-[110px]
                     transition-all duration-200 hover:border-brand-accent/30 hover:shadow-lg
                     hover:shadow-brand-accent/5 group
                     ${accent
                       ? 'border-brand-accent/40 bg-brand-accent/5'
                       : 'border-white/8 bg-white/3'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-white/40 text-xs tracking-widest uppercase leading-relaxed">{label}</p>
        {spark && <Sparkline data={spark} />}
      </div>
      <div className="mt-2">
        <p className={`font-display text-3xl leading-none ${accent ? 'text-brand-accent' : 'text-white'}`}>
          {value ?? 0}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          {sub && <p className="text-white/30 text-xs">{sub}</p>}
          {change !== undefined && change !== null && (
            <span className={`text-xs font-medium ${isPos ? 'text-green-400' : isNeg ? 'text-red-400' : 'text-white/30'}`}>
              {isPos ? '▲' : isNeg ? '▼' : '–'} {Math.abs(change)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, sub, children, action }) {
  return (
    <section className="mb-10">
      <div className="flex items-end justify-between mb-5">
        <div>
          {sub && <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">{sub}</p>}
          <h2 className="text-white font-display text-xl">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Chart card wrapper
// ─────────────────────────────────────────────────────────────────────────────
function ChartCard({ title, children, className = '', loading, height = 220 }) {
  if (loading) return <ChartSkeleton height={height} />;
  return (
    <div className={`border border-white/8 bg-white/3 rounded-lg p-5
                     hover:border-brand-accent/25 hover:shadow-lg hover:shadow-brand-accent/5
                     transition-all duration-200 ${className}`}>
      {title && (
        <p className="text-white/40 text-[10px] tracking-[0.15em] uppercase mb-4 font-medium">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom tooltip for recharts
// ─────────────────────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 6, padding: '10px 14px', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}>
      {label && (
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
      )}
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color || ACCENT, flexShrink: 0 }} />
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{p.name}:</span>
          <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>
            {formatter ? formatter(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Star rating display
// ─────────────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <span className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((s) => (
        <svg key={s} className={`${sz} ${s <= Math.round(rating) ? 'text-brand-accent' : 'text-white/15'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Date range filter bar
// ─────────────────────────────────────────────────────────────────────────────
function DateFilterBar({ activeDays, onSelect }) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {DATE_PRESETS.map(({ label, days }) => (
        <button
          key={label}
          onClick={() => onSelect(days)}
          className={`px-3 py-1 text-xs uppercase tracking-widest rounded transition-colors duration-150
            ${activeDays === days
              ? 'bg-brand-accent text-black font-semibold'
              : 'border border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Revenue Section
// ─────────────────────────────────────────────────────────────────────────────
function RevenueSection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const monthly = (data?.monthlyRevenue ?? []).map((r) => ({
    name: monthLabel(r.year, r.month),
    deposits: r.depositRevenue,
  }));

  return (
    <Section title="Revenue" sub="Financial">
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Today"       value={fmtKsh(data?.revenueToday)}  loading={loading} accent />
        <StatCard label="This Week"   value={fmtKsh(data?.revenueWeek)}   loading={loading} />
        <StatCard label="This Month"  value={fmtKsh(data?.revenueMonth)}  loading={loading} />
        <StatCard label="This Year"   value={fmtKsh(data?.revenueYear)}   loading={loading} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Deposits Received"    value={fmtKsh(data?.depositsReceived)}     loading={loading} />
        <StatCard label="Final Payments"       value={fmtKsh(data?.finalPaymentsReceived)} loading={loading} />
        <StatCard label="Outstanding Balance"  value={fmtKsh(data?.outstandingPayments)}  loading={loading} />
      </div>

      {/* Monthly revenue bar chart */}
      <ChartCard title="Monthly Deposit Revenue" loading={loading} height={260}>
        {monthly.length === 0 ? <EmptyState label="No revenue data yet" /> : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthly} margin={{ top: 8, right: 16, bottom: 4, left: 16 }}
              barCategoryGap="35%">
              <defs>
                <linearGradient id="barGradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={ACCENT} stopOpacity={1}   />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0.35}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="name"
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false} />
              <YAxis
                tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}
                width={48} />
              <Tooltip content={<CustomTooltip formatter={fmtKsh} />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Bar dataKey="deposits" fill="url(#barGradRevenue)" radius={[4,4,0,0]} name="Deposits"
                isAnimationActive animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </ChartCard>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings Section
// ─────────────────────────────────────────────────────────────────────────────
function BookingsSection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const statusBreakdown = data?.statusBreakdown ?? {};
  const pieData = Object.entries(statusBreakdown)
    .filter(([, v]) => v > 0)
    .map(([name, value]) => ({ name, value }));

  const monthly = (data?.trendMonthly ?? []).map((r) => ({
    name: monthLabel(r.year, r.month),
    bookings: r.count,
  }));

  const timeSlots = (data?.timeSlots ?? []).slice(0, 12).map((t) => ({
    name: `${String(t.hour).padStart(2,'0')}:00`,
    count: t.count,
  }));

  const sizeBreakdown = (data?.sizeBreakdown ?? []).map((s) => ({
    name: s.size || 'Unknown',
    value: s.count,
  }));

  return (
    <Section title="Bookings" sub="Appointments">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Bookings"   value={data?.totalBookings}   loading={loading} accent />
        <StatCard label="Completion Rate"  value={`${data?.completionRate ?? 0}%`}  loading={loading} />
        <StatCard label="Cancellation Rate" value={`${data?.cancellationRate ?? 0}%`} loading={loading} />
        <StatCard
          label="Busiest Month"
          value={data?.busiestMonth ? monthLabel(data.busiestMonth.year, data.busiestMonth.month) : '—'}
          sub={data?.busiestMonth ? `${data.busiestMonth.count} bookings` : undefined}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(statusBreakdown).map(([status, count]) => (
          <div key={status}
            className="border border-white/8 bg-white/3 rounded-lg p-4 hover:border-white/15
                       transition-colors duration-200">
            {loading ? <Skeleton className="h-4 w-full mb-2" /> : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]?.dot ?? 'bg-white/30'}`} />
                  <p className="text-white/40 text-xs uppercase tracking-widest capitalize">{status}</p>
                </div>
                <p className="font-display text-2xl text-white">{count}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Monthly trend area chart */}
        <ChartCard title="Monthly Booking Trend" loading={loading} height={220}>
          {monthly.length === 0 ? <EmptyState label="No booking trend data" /> : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={monthly} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}>
                <defs>
                  <linearGradient id="areaGradBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />
                <Area type="monotone" dataKey="bookings" stroke={ACCENT} strokeWidth={2.5}
                  fill="url(#areaGradBookings)" name="Bookings"
                  dot={false}
                  activeDot={{ r: 5, fill: ACCENT, stroke: '#0B0B0B', strokeWidth: 2 }}
                  isAnimationActive animationDuration={900} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Status doughnut with center label */}
        <ChartCard title="Status Breakdown" loading={loading} height={220}>
          {pieData.length === 0 ? <EmptyState label="No booking data" /> : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={88}
                    paddingAngle={2} dataKey="value" startAngle={90} endAngle={-270}
                    isAnimationActive animationDuration={900}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name}
                        fill={PIE_STATUS_COLORS[entry.name] ?? PIE_COLORS[0]}
                        stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle" iconSize={7}
                    wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
                    formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center total label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                   style={{ paddingBottom: 28 }}>
                <p className="font-display text-2xl text-white leading-none">
                  {pieData.reduce((s, d) => s + d.value, 0)}
                </p>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">total</p>
              </div>
            </div>
          )}
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Time slot heat-map bar chart */}
        <ChartCard title="Popular Time Slots" loading={loading} height={210}>
          {timeSlots.length === 0 ? <EmptyState label="No time slot data" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={timeSlots} margin={{ top: 8, right: 16, bottom: 4, left: 8 }}
                barCategoryGap="25%">
                <defs>
                  {timeSlots.map((_, i) => {
                    const maxCount = Math.max(...timeSlots.map(t => t.count));
                    const intensity = timeSlots[i] ? timeSlots[i].count / maxCount : 0;
                    return (
                      <linearGradient key={i} id={`slotGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor={ACCENT} stopOpacity={0.3 + intensity * 0.7} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0.1 + intensity * 0.3} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name"
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                <YAxis
                  tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }}
                  axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
                <Bar dataKey="count" radius={[3,3,0,0]} name="Bookings"
                  isAnimationActive animationDuration={800}>
                  {timeSlots.map((_, i) => (
                    <Cell key={i} fill={`url(#slotGrad${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        {/* Size breakdown doughnut */}
        <ChartCard title="Tattoo Size Breakdown" loading={loading} height={210}>
          {sizeBreakdown.length === 0 ? <EmptyState label="No size data" /> : (
            <ResponsiveContainer width="100%" height={210}>
              <PieChart>
                <Pie data={sizeBreakdown} cx="50%" cy="46%" innerRadius={50} outerRadius={78}
                  paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}
                  isAnimationActive animationDuration={900}>
                  {sizeBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                  ))}
                </Pie>
                <Legend iconType="circle" iconSize={7}
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{v}</span>} />
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>
    </Section>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Customers Section
// ─────────────────────────────────────────────────────────────────────────────
function CustomersSection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const topCustomers = data?.topCustomers ?? [];

  return (
    <Section title="Customers" sub="Insights">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Customers"     value={data?.totalCustomers}     loading={loading} accent />
        <StatCard label="New This Period"      value={data?.newCustomers}       loading={loading} />
        <StatCard label="Returning Customers"  value={data?.returningCustomers} loading={loading} />
      </div>

      <ChartCard title="Top Customers by Spend" loading={loading}>
        {topCustomers.length === 0 ? <EmptyState label="No customer spend data yet" /> : (
          <div className="divide-y divide-white/6">
            {topCustomers.map((c, i) => (
              <div key={String(c._id)} className="flex items-center gap-3 py-3 hover:bg-white/3
                                                   transition-colors -mx-5 px-5 group">
                <span className="w-6 text-white/20 text-xs font-mono flex-shrink-0">{i + 1}</span>
                <div className="w-8 h-8 rounded-full bg-brand-accent/15 border border-brand-accent/20
                                flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-accent text-xs font-semibold">
                    {(c.customerName || c.email || '?')[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{c.customerName || c.email || '—'}</p>
                  <p className="text-white/30 text-xs">{c.totalVisits} visit{c.totalVisits !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-brand-accent text-sm font-medium">{fmtKsh(c.totalSpent)}</p>
                  {c.avgRating && (
                    <div className="flex items-center justify-end gap-1 mt-0.5">
                      <Stars rating={c.avgRating} />
                      <span className="text-white/30 text-xs">{c.avgRating}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </ChartCard>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Reviews Section
// ─────────────────────────────────────────────────────────────────────────────
function ReviewsSection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const dist = data?.distribution ?? [];
  const latest = data?.latestReviews ?? [];

  return (
    <Section title="Reviews" sub="Reputation">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Big avg rating */}
        <ChartCard loading={loading} className="flex flex-col items-center justify-center py-6">
          {loading ? (
            <div className="space-y-3 w-full"><Skeleton className="h-16 w-24 mx-auto" /><Skeleton className="h-4 w-16 mx-auto" /></div>
          ) : (
            <>
              <p className="font-display text-7xl text-brand-accent leading-none">
                {data?.avgRating ?? '—'}
              </p>
              <Stars rating={data?.avgRating ?? 0} size="lg" />
              <p className="text-white/30 text-xs mt-2">{data?.total ?? 0} reviews</p>
            </>
          )}
        </ChartCard>

        {/* Star distribution */}
        <ChartCard title="Rating Distribution" loading={loading} className="lg:col-span-2">
          {dist.length === 0 ? <EmptyState label="No reviews yet" /> : (
            <div className="space-y-3 py-1">
              {dist.map(({ stars, count, pct }) => {
                const intensity = stars / 5;
                const barColor  = `rgba(196,154,68,${0.3 + intensity * 0.7})`;
                return (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-10 flex-shrink-0 justify-end">
                      <span className="text-white/50 text-xs">{stars}</span>
                      <svg className="w-3 h-3 text-brand-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    <div className="flex-1 h-2.5 bg-white/6 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <span className="text-white/35 text-xs w-6 flex-shrink-0 text-right">{count}</span>
                    <span className="text-white/20 text-xs w-8 flex-shrink-0 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          )}
        </ChartCard>
      </div>

      {/* Latest reviews */}
      <ChartCard title="Latest Reviews" loading={loading}>
        {latest.length === 0 ? <EmptyState label="No reviews yet" /> : (
          <div className="divide-y divide-white/6">
            {latest.map((r) => {
              const name = r.customer
                ? `${r.customer.firstName} ${r.customer.lastName}`
                : 'Customer';
              return (
                <div key={r._id} className="py-3 hover:bg-white/3 transition-colors -mx-5 px-5">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand-accent/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-accent text-[10px] font-semibold">{name[0]}</span>
                      </div>
                      <p className="text-white text-sm">{name}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Stars rating={r.rating} />
                      <span className="text-white/25 text-xs">{fmtDate(r.createdAt)}</span>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-white/40 text-xs leading-relaxed ml-8 line-clamp-2">{r.comment}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ChartCard>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tattoo Styles Section
// ─────────────────────────────────────────────────────────────────────────────
function TattooStylesSection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const byCategory = data?.byCategory ?? [];

  return (
    <Section title="Tattoo Style Trends" sub="Portfolio">
      <StatCard label="Total Tattoos" value={data?.totalTattoos} loading={loading} accent />
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Doughnut with centre label */}
        <ChartCard title="Category Distribution" loading={loading} height={280}>
          {byCategory.length === 0 ? <EmptyState label="No tattoo categories yet" /> : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={byCategory} cx="50%" cy="46%" innerRadius={64} outerRadius={102}
                    paddingAngle={2} dataKey="count" nameKey="category"
                    startAngle={90} endAngle={-270}
                    isAnimationActive animationDuration={900}>
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={7}
                    wrapperStyle={{ fontSize: 11 }}
                    formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>{v}</span>} />
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Centre label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                   style={{ paddingBottom: 40 }}>
                <p className="font-display text-2xl text-white leading-none">{data?.totalTattoos ?? 0}</p>
                <p className="text-white/30 text-[10px] uppercase tracking-widest mt-1">styles</p>
              </div>
            </div>
          )}
        </ChartCard>

        {/* Animated progress-bar list */}
        <ChartCard title="Category Popularity" loading={loading} height={280}>
          {byCategory.length === 0 ? <EmptyState label="No data" /> : (
            <div className="space-y-4 pt-1">
              {byCategory.slice(0, 7).map((c, i) => (
                <div key={c.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-white/70 text-xs capitalize">
                        {c.category || 'Uncategorised'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-white/30 text-xs">{c.count}</span>
                      <span className="text-white/20 text-xs w-8 text-right">{c.pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-white/6 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${c.pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Business Performance Section
// ─────────────────────────────────────────────────────────────────────────────
function PerformanceSection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const metrics = [
    { label: 'Avg Booking Value',   value: fmtKsh(data?.avgBookingValue),   accent: true },
    { label: 'Avg Deposit Amount',  value: fmtKsh(data?.avgDepositAmount),  accent: false },
    { label: 'Avg Tattoo Price',    value: fmtKsh(data?.avgTattooPrice),    accent: false },
    { label: 'Completion Rate',     value: `${data?.completionRate ?? 0}%`,  accent: false },
    { label: 'Repeat Customer Rate',value: `${data?.repeatCustomerRate ?? 0}%`, accent: false },
  ];

  return (
    <Section title="Business Performance" sub="KPIs">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {metrics.map((m) => (
          <StatCard key={m.label} label={m.label} value={m.value} loading={loading} accent={m.accent} />
        ))}
      </div>
    </Section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity Timeline Section
// ─────────────────────────────────────────────────────────────────────────────
function ActivitySection({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const events = data ?? [];

  return (
    <Section title="Recent Activity" sub="Timeline">
      <ChartCard loading={loading}>
        {events.length === 0 ? <EmptyState label="No recent activity" /> : (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-white/8" />
            <div className="space-y-0">
              {events.map((e, i) => {
                const meta = ACTIVITY_ICONS[e.type] ?? { emoji: '•', color: 'text-white/40' };
                return (
                  <div key={i} className="flex gap-4 pl-2 py-3 hover:bg-white/2 transition-colors
                                           -mx-5 px-5 rounded">
                    <div className="w-6 h-6 rounded-full bg-[#111] border border-white/10
                                    flex items-center justify-center flex-shrink-0 z-10 text-xs">
                      {meta.emoji}
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={`text-xs font-medium uppercase tracking-wider ${meta.color}`}>
                            {e.label}
                          </span>
                          <p className="text-white/50 text-xs mt-0.5 leading-relaxed">{e.desc}</p>
                        </div>
                        <p className="text-white/20 text-xs flex-shrink-0 whitespace-nowrap">
                          {fmtTime(e.date)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </ChartCard>
    </Section>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// Dashboard summary cards row (top of page)
// ─────────────────────────────────────────────────────────────────────────────
function SummaryRow({ data, loading, error, onRetry }) {
  if (error) return (
    <div className="border border-white/8 rounded-lg mb-8">
      <ErrorState message={error} onRetry={onRetry} />
    </div>
  );

  const sparks = data?.sparklines;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        label="Total Bookings"
        value={data?.totalBookings}
        change={data?.changes?.totalBookings}
        spark={sparks?.sparkBookings}
        loading={loading}
        accent
      />
      <StatCard
        label="Completed"
        value={data?.completedBookings}
        change={data?.changes?.completedBookings}
        loading={loading}
      />
      <StatCard
        label="Customers"
        value={data?.totalCustomers}
        change={data?.changes?.totalCustomers}
        spark={sparks?.sparkRevenue?.map((v, i) => sparks?.sparkBookings?.[i] ?? 0)}
        loading={loading}
      />
      <StatCard
        label="Avg Rating"
        value={data?.avgRating ? `${data.avgRating}★` : '—'}
        sub={`${data?.returningCustomers ?? 0} returning`}
        loading={loading}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
function ReportsAnalytics() {
  const [activeDays, setActiveDays] = useState(30);

  // Each section has independent loading/error state
  const [summary,      setSummary]      = useState(null);
  const [revenue,      setRevenue]      = useState(null);
  const [bookings,     setBookings]     = useState(null);
  const [customers,    setCustomers]    = useState(null);
  const [reviews,      setReviews]      = useState(null);
  const [styles,       setStyles]       = useState(null);
  const [performance,  setPerformance]  = useState(null);
  const [activity,     setActivity]     = useState(null);

  const [loadingMap,   setLoadingMap]   = useState({});
  const [errorMap,     setErrorMap]     = useState({});

  const setLoading = (key, v) => setLoadingMap((m) => ({ ...m, [key]: v }));
  const setError   = (key, v) => setErrorMap((m) => ({ ...m, [key]: v }));

  const qs = useCallback(() => {
    const range = buildDateRange(activeDays);
    const params = new URLSearchParams(range).toString();
    return params ? `?${params}` : '';
  }, [activeDays]);

  const fetchSection = useCallback(async (key, path, setter) => {
    setLoading(key, true);
    setError(key, null);
    try {
      const res = await api.get(`/admin/reports/${path}${qs()}`);
      setter(res.data.data);
    } catch (err) {
      setError(key, err.message || 'Failed to load');
    } finally {
      setLoading(key, false);
    }
  }, [qs]);

  const fetchAll = useCallback(() => {
    fetchSection('summary',     'dashboard',     setSummary);
    fetchSection('revenue',     'revenue',       setRevenue);
    fetchSection('bookings',    'bookings',      setBookings);
    fetchSection('customers',   'customers',     setCustomers);
    fetchSection('reviews',     'reviews',       setReviews);
    fetchSection('styles',      'tattoo-styles', setStyles);
    fetchSection('performance', 'performance',   setPerformance);
    fetchSection('activity',    'activity',      setActivity);
  }, [fetchSection]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const tabs = [
    { id: 'overview',     label: 'Overview'     },
    { id: 'revenue',      label: 'Revenue'      },
    { id: 'bookings',     label: 'Bookings'     },
    { id: 'customers',    label: 'Customers'    },
    { id: 'reviews',      label: 'Reviews'      },
    { id: 'styles',       label: 'Styles'       },
    { id: 'performance',  label: 'Performance'  },
    { id: 'activity',     label: 'Activity'     },
  ];
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-2">Analytics</p>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <h1 className="font-display text-3xl text-white">Reports &amp; Analytics</h1>
          <div className="flex items-center gap-3">
            <DateFilterBar activeDays={activeDays} onSelect={setActiveDays} />
            <button
              onClick={fetchAll}
              title="Refresh all"
              className="p-2 border border-white/10 text-white/40 hover:text-white hover:border-white/30
                         transition-colors rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0
                     0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Section tabs (scrollable on mobile) */}
      <div className="flex gap-1 mb-8 overflow-x-auto pb-1 border-b border-white/8">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-2 text-xs uppercase tracking-widest whitespace-nowrap transition-colors
              ${activeTab === id
                ? 'text-brand-accent border-b-2 border-brand-accent -mb-px'
                : 'text-white/35 hover:text-white/70'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Summary row always visible */}
      <SummaryRow
        data={summary}
        loading={loadingMap.summary}
        error={errorMap.summary}
        onRetry={() => fetchSection('summary', 'dashboard', setSummary)}
      />

      {/* Tabbed sections */}
      {(activeTab === 'overview' || activeTab === 'revenue') && (
        <RevenueSection
          data={revenue}
          loading={loadingMap.revenue}
          error={errorMap.revenue}
          onRetry={() => fetchSection('revenue', 'revenue', setRevenue)}
        />
      )}
      {(activeTab === 'overview' || activeTab === 'bookings') && (
        <BookingsSection
          data={bookings}
          loading={loadingMap.bookings}
          error={errorMap.bookings}
          onRetry={() => fetchSection('bookings', 'bookings', setBookings)}
        />
      )}
      {(activeTab === 'overview' || activeTab === 'customers') && (
        <CustomersSection
          data={customers}
          loading={loadingMap.customers}
          error={errorMap.customers}
          onRetry={() => fetchSection('customers', 'customers', setCustomers)}
        />
      )}
      {(activeTab === 'overview' || activeTab === 'reviews') && (
        <ReviewsSection
          data={reviews}
          loading={loadingMap.reviews}
          error={errorMap.reviews}
          onRetry={() => fetchSection('reviews', 'reviews', setReviews)}
        />
      )}
      {(activeTab === 'overview' || activeTab === 'styles') && (
        <TattooStylesSection
          data={styles}
          loading={loadingMap.styles}
          error={errorMap.styles}
          onRetry={() => fetchSection('styles', 'tattoo-styles', setStyles)}
        />
      )}
      {(activeTab === 'overview' || activeTab === 'performance') && (
        <PerformanceSection
          data={performance}
          loading={loadingMap.performance}
          error={errorMap.performance}
          onRetry={() => fetchSection('performance', 'performance', setPerformance)}
        />
      )}
      {(activeTab === 'overview' || activeTab === 'activity') && (
        <ActivitySection
          data={activity}
          loading={loadingMap.activity}
          error={errorMap.activity}
          onRetry={() => fetchSection('activity', 'activity', setActivity)}
        />
      )}
    </div>
  );
}

export default ReportsAnalytics;
