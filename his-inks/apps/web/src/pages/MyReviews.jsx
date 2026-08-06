import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STARS = [1, 2, 3, 4, 5];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

// ── Star rating display ───────────────────────────────────────────────────────
function StarDisplay({ rating, size = 'md' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';
  return (
    <div className="flex gap-0.5">
      {STARS.map((s) => (
        <svg key={s} className={`${sz} ${s <= rating ? 'text-brand-accent' : 'text-white/15'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

// ── Star rating input ─────────────────────────────────────────────────────────
function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {STARS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          className="focus:outline-none"
          aria-label={`${s} star`}
        >
          <svg className={`w-7 h-7 transition-colors ${s <= (hovered || value) ? 'text-brand-accent' : 'text-white/20'}`}
            fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </button>
      ))}
      {value > 0 && (
        <span className="text-brand-accent text-sm self-center ml-1">{value}/5</span>
      )}
    </div>
  );
}

// ── Review form (create or edit) ──────────────────────────────────────────────
function ReviewForm({ appointment, existing, onSave, onCancel }) {
  const [rating,  setRating]  = useState(existing?.rating  ?? 0);
  const [title,   setTitle]   = useState(existing?.title   ?? '');
  const [comment, setComment] = useState(existing?.comment ?? '');
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');

  const isEdit = Boolean(existing);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!rating)          return setError('Please select a rating.');
    if (!comment.trim())  return setError('Comment is required.');

    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await api.patch(`/reviews/${existing._id}`, { rating, title, comment });
      } else {
        res = await api.post('/reviews', {
          appointment: appointment._id,
          rating, title, comment,
        });
      }
      onSave(res.data.data.review);
    } catch (err) {
      setError(err.message || 'Failed to save review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!isEdit && appointment && (
        <div className="bg-white/3 border border-white/8 px-4 py-3">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Reviewing</p>
          <p className="text-white text-sm">{appointment.tattooIdea}</p>
          <p className="text-white/40 text-xs mt-0.5">{fmtDate(appointment.preferredDate)}</p>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="text-white/40 text-xs uppercase tracking-widest block mb-2">
          Rating <span className="text-red-400">*</span>
        </label>
        <StarInput value={rating} onChange={setRating} />
      </div>

      {/* Title */}
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
                     placeholder-white/20 focus:outline-none focus:border-brand-accent"
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
                     placeholder-white/20 focus:outline-none focus:border-brand-accent resize-none"
        />
        <p className="text-white/20 text-xs mt-1 text-right">{comment.length}/1000</p>
      </div>

      {error && (
        <p className="text-red-400 text-sm px-4 py-2.5 bg-red-500/10 border border-red-500/20">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50"
        >
          {saving ? 'Saving…' : isEdit ? 'Update Review' : 'Submit Review'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-white/40 hover:text-white transition-colors px-4 py-2.5 border border-white/10 hover:border-white/20"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Single review card ────────────────────────────────────────────────────────
function ReviewCard({ review, onEdit, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    setDeleting(true);
    try {
      await api.delete(`/reviews/${review._id}`);
      onDelete(review._id);
    } catch (err) {
      alert(err.message || 'Failed to delete.');
      setDeleting(false);
    }
  };

  return (
    <div className="border border-white/10 p-6 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <StarDisplay rating={review.rating} />
          {review.title && (
            <p className="text-white font-medium">{review.title}</p>
          )}
          <p className="text-white/30 text-xs">
            {review.appointment?.tattooIdea} · {fmtDate(review.appointment?.preferredDate)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Visibility badge */}
          <span className={`text-[10px] px-2 py-0.5 border uppercase tracking-wider ${
            review.isVisible
              ? 'text-green-400 bg-green-400/10 border-green-400/20'
              : 'text-white/30 bg-white/5 border-white/10'
          }`}>
            {review.isVisible ? 'Visible' : 'Hidden'}
          </span>
          <p className="text-white/25 text-xs">{fmtDate(review.createdAt)}</p>
        </div>
      </div>

      {/* Comment */}
      <p className="text-white/70 text-sm leading-relaxed">{review.comment}</p>

      {/* Artist reply */}
      {review.artistReply && (
        <div className="bg-brand-accent/5 border border-brand-accent/20 px-4 py-3 ml-4">
          <p className="text-brand-accent text-xs uppercase tracking-widest mb-1">Studio Reply</p>
          <p className="text-white/70 text-sm leading-relaxed">{review.artistReply}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-1 border-t border-white/5">
        <button
          onClick={() => onEdit(review)}
          className="text-xs text-white/40 hover:text-white transition-colors tracking-widest uppercase"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-white/30 hover:text-red-400 transition-colors tracking-widest uppercase disabled:opacity-40"
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </div>
  );
}

// ── Completed bookings without a review (eligible to review) ──────────────────
function EligibleBookings({ reviewed, onStart }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    api.get('/users/my-bookings')
      .then((r) => {
        const completed = r.data.data.bookings.filter((b) => b.status === 'completed');
        const reviewedIds = new Set(reviewed.map((r) => r.appointment?._id));
        setBookings(completed.filter((b) => !reviewedIds.has(b._id)));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [reviewed]);

  if (loading) return null;
  if (bookings.length === 0) return null;

  return (
    <div className="border border-dashed border-brand-accent/20 p-6">
      <p className="text-brand-accent text-xs uppercase tracking-widest mb-3">
        Ready to review
      </p>
      <div className="space-y-2">
        {bookings.map((b) => (
          <div key={b._id} className="flex items-center justify-between gap-4">
            <div>
              <p className="text-white text-sm">{b.tattooIdea}</p>
              <p className="text-white/40 text-xs">{b.placement} · {fmtDate(b.preferredDate)}</p>
            </div>
            <button
              onClick={() => onStart(b)}
              className="btn-outline text-xs py-1.5 px-4 flex-shrink-0"
            >
              Write Review
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function MyReviews() {
  const [reviews,  setReviews]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [editing,  setEditing]  = useState(null);   // review being edited
  const [creating, setCreating] = useState(null);   // booking being reviewed (new)

  const loadReviews = () => {
    setLoading(true);
    api.get('/reviews/me')
      .then((r) => setReviews(r.data.data.reviews))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReviews(); }, []);

  const handleSave = (saved) => {
    setReviews((prev) => {
      const idx = prev.findIndex((r) => r._id === saved._id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = saved;
        return updated;
      }
      return [saved, ...prev];
    });
    setEditing(null);
    setCreating(null);
  };

  const handleDelete = (id) => setReviews((prev) => prev.filter((r) => r._id !== id));

  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="mb-10">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Account</p>
          <h1 className="font-display text-4xl text-white mb-2">My Reviews</h1>
          <p className="text-white/40 text-sm">
            Share your experience after each completed appointment.
          </p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Eligible bookings (write new review) */}
        {!creating && !editing && !loading && (
          <div className="mb-8">
            <EligibleBookings
              reviewed={reviews}
              onStart={(booking) => setCreating(booking)}
            />
          </div>
        )}

        {/* Create form */}
        {creating && (
          <div className="mb-8 border border-brand-accent/30 p-6 bg-brand-accent/3">
            <p className="text-brand-accent text-xs uppercase tracking-widest mb-5">New Review</p>
            <ReviewForm
              appointment={creating}
              onSave={handleSave}
              onCancel={() => setCreating(null)}
            />
          </div>
        )}

        {/* Reviews list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 && !creating ? (
          <div className="border border-dashed border-white/10 py-20 text-center">
            <p className="text-white/30 mb-2">You haven&apos;t written any reviews yet.</p>
            <p className="text-white/20 text-sm">
              Complete an appointment to unlock your first review.
            </p>
            <Link to="/my-bookings" className="btn-outline text-xs py-2.5 px-6 mt-6 inline-block">
              View My Bookings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) =>
              editing?._id === r._id ? (
                <div key={r._id} className="border border-brand-accent/30 p-6 bg-brand-accent/3">
                  <p className="text-brand-accent text-xs uppercase tracking-widest mb-5">Edit Review</p>
                  <ReviewForm
                    existing={r}
                    onSave={handleSave}
                    onCancel={() => setEditing(null)}
                  />
                </div>
              ) : (
                <ReviewCard
                  key={r._id}
                  review={r}
                  onEdit={(rev) => { setEditing(rev); setCreating(null); }}
                  onDelete={handleDelete}
                />
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyReviews;
