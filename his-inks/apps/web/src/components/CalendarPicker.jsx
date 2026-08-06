import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * CalendarPicker
 *
 * Props:
 *   selectedDate  — "YYYY-MM-DD" string or ""
 *   onDateSelect  — (dateStr) => void
 *   error         — optional validation error string
 */
function CalendarPicker({ selectedDate, onDateSelect, error }) {
  const today    = new Date();
  const todayStr = toDateStr(today);

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth() + 1);
  const [monthMap,  setMonthMap]  = useState({});
  const [loading,   setLoading]   = useState(false);
  const [fetchErr,  setFetchErr]  = useState('');

  const fetchMonth = useCallback(async (year, month) => {
    setLoading(true);
    setFetchErr('');
    try {
      const res = await api.get(`/availability/month?year=${year}&month=${month}`);
      setMonthMap(res.data.data);
    } catch {
      setFetchErr('Could not load calendar. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMonth(viewYear, viewMonth);
  }, [viewYear, viewMonth, fetchMonth]);

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth() + 1;

  const goPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12); }
    else setViewMonth(m => m - 1);
  };

  const goNext = () => {
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay    = new Date(viewYear, viewMonth - 1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  /**
   * Returns { bg, text, border, cursor, label } for each status.
   * Keeping colours bold and distinct so there's zero ambiguity.
   */
  const getStyle = (dateStr) => {
    if (!dateStr) return null;

    // Selected — accent fill
    if (dateStr === selectedDate) {
      return {
        bg:     'bg-brand-accent',
        text:   'text-black font-bold',
        border: 'border-brand-accent',
        cursor: 'cursor-pointer',
        ring:   'ring-2 ring-brand-accent ring-offset-1 ring-offset-black',
      };
    }

    const status = monthMap[dateStr];
    switch (status) {
      case 'available':
        return {
          bg:     'bg-white/5 hover:bg-brand-accent/20',
          text:   'text-white font-medium',
          border: 'border-white/20 hover:border-brand-accent',
          cursor: 'cursor-pointer',
          ring:   '',
        };
      case 'booked':
        return {
          bg:     'bg-red-900/40',
          text:   'text-red-400/70 line-through',
          border: 'border-red-800/50',
          cursor: 'cursor-not-allowed',
          ring:   '',
        };
      case 'closed':
        return {
          bg:     'bg-white/[0.02]',
          text:   'text-white/20',
          border: 'border-white/5',
          cursor: 'cursor-not-allowed',
          ring:   '',
        };
      case 'past':
        return {
          bg:     'bg-transparent',
          text:   'text-white/15',
          border: 'border-white/5',
          cursor: 'cursor-not-allowed',
          ring:   '',
        };
      default:
        // Still loading
        return {
          bg:     'bg-white/3 animate-pulse',
          text:   'text-white/20',
          border: 'border-white/5',
          cursor: 'cursor-default',
          ring:   '',
        };
    }
  };

  const handleDayClick = (dateStr) => {
    if (monthMap[dateStr] === 'available') onDateSelect(dateStr);
  };

  return (
    <div className="space-y-3">

      {/* ── Month navigation header ── */}
      <div className="flex items-center justify-between mb-1">
        <button
          type="button"
          onClick={goPrev}
          disabled={!canGoPrev}
          className="w-9 h-9 flex items-center justify-center border border-white/10
                     text-white/50 hover:text-white hover:border-white/30
                     disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
          aria-label="Previous month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <span className="text-white font-medium tracking-wide text-sm">
          {MONTH_NAMES[viewMonth - 1]} {viewYear}
          {loading && (
            <span className="ml-2 text-white/30 text-xs font-normal">loading…</span>
          )}
        </span>

        <button
          type="button"
          onClick={goNext}
          className="w-9 h-9 flex items-center justify-center border border-white/10
                     text-white/50 hover:text-white hover:border-white/30 transition-colors"
          aria-label="Next month"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* ── Fetch error ── */}
      {fetchErr && <p className="text-red-400 text-xs">{fetchErr}</p>}

      {/* ── Day-of-week labels ── */}
      <div className="grid grid-cols-7 gap-1">
        {DAY_LABELS.map(d => (
          <div key={d} className="text-center text-white/30 text-xs py-1 tracking-widest uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* ── Day grid ── */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`pad-${idx}`} />;

          const dateStr = `${viewYear}-${String(viewMonth).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const s       = getStyle(dateStr);
          const isToday = dateStr === todayStr;
          const status  = monthMap[dateStr];

          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => handleDayClick(dateStr)}
              className={`
                relative aspect-square flex items-center justify-center text-sm border
                transition-all duration-150 select-none
                ${s.bg} ${s.text} ${s.border} ${s.cursor} ${s.ring}
              `}
              aria-label={`${dateStr}${status ? ' — ' + status : ''}`}
              aria-pressed={dateStr === selectedDate}
              tabIndex={status === 'available' ? 0 : -1}
            >
              {day}

              {/* Today dot — only on non-past, non-selected days */}
              {isToday && dateStr !== selectedDate && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-brand-accent" />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Legend ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5">
        <LegendItem
          bg="bg-white/5 border border-white/20"
          label="Available"
          sub="Click to select"
        />
        <LegendItem
          bg="bg-brand-accent"
          label="Selected"
          sub="Your chosen date"
        />
        <LegendItem
          bg="bg-red-900/40 border border-red-800/50"
          label="Booked"
          sub="Taken — pick another"
        />
        <LegendItem
          bg="bg-white/[0.02] border border-white/5"
          label="Closed / Past"
          sub="Not available"
          textMuted
        />
      </div>

      {/* ── Validation error ── */}
      {error && !selectedDate && (
        <p className="text-red-400 text-xs mt-1">{error}</p>
      )}
    </div>
  );
}

function LegendItem({ bg, label, sub, textMuted }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-4 h-4 flex-shrink-0 rounded-sm ${bg}`} />
      <span>
        <span className={`block text-xs ${textMuted ? 'text-white/25' : 'text-white/60'}`}>{label}</span>
        <span className="block text-white/25 text-[10px] leading-tight">{sub}</span>
      </span>
    </div>
  );
}

function toDateStr(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default CalendarPicker;
