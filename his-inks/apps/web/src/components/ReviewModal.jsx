import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const STARS = [1, 2, 3, 4, 5];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

// ── Star rating input ─────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1.5">
      {STARS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none transition-transform hover:scale-110"
          aria-label={`${s} star${s !== 1 ? 's' : ''}`}
        >
          <svg
            className={`w-8 h-8 transition-colors ${
              s <= (hovered || value) ? 'text-brand-accent' : 'text-white/20'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-brand-accent text-sm self-center ml-1 tabular-nums">
          {value}/5
        </span>
      )}
    </div>
  );
}

// ── ReviewModal ───────────────────────────────────────────────────────────────
/**
 * Props:
 *   booking  – the completed booking object to review (required)
 *   onClose  – called when the modal should close
 *   onSaved  – called with the new review object after a successful submission
 */
export default function ReviewModal({ booking, onClose, onSaved }) {
  const [rating,  setRating]  = useState(0);
  const [title,   setTitle]   = useState('');
  const [comment, setComment] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const [done,    setDone]    = useState(false);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e) => { if (e.key === 'Escape') onClose(); },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating)         return setError('Please select a rating.');
    if (!comment.trim()) return setError('Comment is required.');

    setSaving(true);
    try {
      const res = await api.post('/reviews', {
        appointment: booking._id,
        rating,
        title,
        comment,
      });
      setDone(true);
      onSaved?.(res.data.data.review);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Rate your session"
    >
      {/* Panel */}
      <div className="relative w-full max-w-lg bg-[#0d0d0d] border border-white/10 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-white/8">
          <div>
            <p className="text-brand-accent text-xs uppercase tracking-[0.35em] mb-1">
              Rate Your Session
            </p>
            <h2 className="font-display text-2xl text-white">How did it go?</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white transition-colors mt-0.5"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {done ? (
            /* ── Success state ── */
            <div className="text-center py-6">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-400/10 border border-green-400/20
                              flex items-center justify-center">
                <svg className="w-7 h-7 text-green-400" fill="none" stroke="currentColor"
                  strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-medium mb-1">Thank you for your review!</p>
              <p className="text-white/40 text-sm">Your feedback means a lot to us.</p>
              <button
                onClick={onClose}
                className="mt-6 btn-primary text-xs py-2.5 px-8"
              >
                Done
              </button>
            </div>
          ) : (
            /* ── Form ── */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Booking info */}
              <div className="bg-white/3 border border-white/8 px-4 py-3">
                <p className="text-white text-sm font-medium">{booking.tattooIdea}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {booking.placement} · {fmtDate(booking.preferredDate)}
                </p>
              </div>

              {/* Star rating */}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-widest block mb-3">
                  Rating <span className="text-red-400">*</span>
                </label>
                <StarInput value={rating} onChange={setRating} />
              </div>

              {/* Title (optional) */}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">
                  Title <span className="text-white/20">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  placeholder="e.g. Incredible sleeve work"
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                             placeholder-white/20 focus:outline-none focus:border-brand-accent transition-colors"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">
                  Comment <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Share your experience…"
                  className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                             placeholder-white/20 focus:outline-none focus:border-brand-accent
                             transition-colors resize-none"
                />
                <p className="text-white/20 text-xs mt-1 text-right">{comment.length}/1000</p>
              </div>

              {/* Error */}
              {error && (
                <p className="text-red-400 text-sm px-4 py-2.5 bg-red-500/10 border border-red-500/20">
                  {error}
                </p>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50"
                >
                  {saving ? 'Submitting…' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-white/40 hover:text-white transition-colors px-4 py-2.5
                             border border-white/10 hover:border-white/20"
                >
                  Maybe later
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
