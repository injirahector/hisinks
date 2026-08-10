import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ImageLightbox from '../components/ImageLightbox';
import ReviewModal from '../components/ReviewModal';

const STATUS_STYLES = {
  pending:   { text: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30', label: 'Pending Review' },
  confirmed: { text: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/30',   label: 'Confirmed' },
  completed: { text: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/30',  label: 'Completed' },
  cancelled: { text: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/30',    label: 'Cancelled' },
};

const STATUS_MESSAGES = {
  pending:   "We've received your request and will be in touch within 24–48 hours to confirm.",
  confirmed: 'Your appointment is confirmed! We look forward to seeing you.',
  completed: 'Session complete. Thank you for choosing His Inks Studio.',
  cancelled: 'This booking has been cancelled. Feel free to submit a new request.',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });

// ── Single booking card ───────────────────────────────────────────────────────
function BookingCard({ booking, reviewed, onRate }) {
  const [open,     setOpen]     = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const s            = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;
  const isCompleted  = booking.status === 'completed';
  const hasReviewed  = reviewed.has(booking._id);

  return (
    <div className={`border ${open ? 'border-white/20' : 'border-white/8'} transition-colors`}>
      <button
        className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-white/3 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-white font-medium truncate">{booking.tattooIdea}</p>
          <p className="text-white/40 text-sm mt-0.5">
            {booking.placement} · {booking.size} · {fmtDate(booking.preferredDate)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className={`text-xs px-3 py-1 border ${s.text} ${s.bg} ${s.border}`}>
            {s.label}
          </span>
          <svg className={`w-4 h-4 text-white/30 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/8 p-5 space-y-5">
          <div className={`px-4 py-3 border ${s.border} ${s.bg}`}>
            <p className={`text-sm ${s.text}`}>{STATUS_MESSAGES[booking.status]}</p>
          </div>

          {/* ── Rate prompt (completed, not yet reviewed) ── */}
          {isCompleted && !hasReviewed && (
            <div className="flex items-center justify-between gap-4 px-4 py-3
                            bg-brand-accent/5 border border-brand-accent/20">
              <div>
                <p className="text-brand-accent text-xs uppercase tracking-widest mb-0.5">
                  How was your session?
                </p>
                <p className="text-white/50 text-xs">
                  Share your experience and help others discover the studio.
                </p>
              </div>
              <button
                onClick={() => onRate(booking)}
                className="btn-primary text-xs py-2 px-5 flex-shrink-0 whitespace-nowrap"
              >
                ★ Rate this session
              </button>
            </div>
          )}

          {/* ── Already reviewed ── */}
          {isCompleted && hasReviewed && (
            <div className="flex items-center justify-between gap-4 px-4 py-3
                            bg-white/3 border border-white/8">
              <p className="text-white/40 text-xs">You have already reviewed this session.</p>
              <Link to="/my-reviews" className="text-brand-accent text-xs hover:underline flex-shrink-0">
                View review →
              </Link>
            </div>
          )}

          {/* ── Aftercare reminder (completed bookings) ── */}
          {isCompleted && (
            <div className="flex items-center justify-between gap-4 px-4 py-3
                            border border-white/8 bg-white/3">
              <div>
                <p className="text-white/70 text-xs uppercase tracking-widest mb-0.5">Aftercare</p>
                <p className="text-white/40 text-xs leading-relaxed">
                  Remember to follow your aftercare instructions while your tattoo heals.
                </p>
              </div>
              <Link
                to="/aftercare"
                className="flex-shrink-0 text-xs tracking-widest uppercase border border-white/20
                           text-white/50 hover:text-white hover:border-white/40 px-3 py-1.5 transition-colors whitespace-nowrap"
              >
                Aftercare Guide →
              </Link>
            </div>
          )}

          {booking.notes && (
            <div className="bg-white/3 border border-white/8 px-4 py-3">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-1">Studio Note</p>
              <p className="text-white/70 text-sm leading-relaxed">{booking.notes}</p>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Placement</p>
              <p className="text-white text-sm">{booking.placement}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Size</p>
              <p className="text-white text-sm">{booking.size}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Preferred Date</p>
              <p className="text-white text-sm">{fmtDate(booking.preferredDate)}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Phone</p>
              <p className="text-white text-sm">{booking.phone}</p>
            </div>
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-white text-sm">{fmtDate(booking.createdAt)}</p>
            </div>
            {booking.bookingLocation && (
              <div>
                <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Booking Location</p>
                <p className="text-white text-sm">
                  {booking.bookingLocation === 'studio' ? 'Come to Studio' : 'House Call'}
                </p>
              </div>
            )}
          </div>

          {booking.description && (
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Description</p>
              <p className="text-white/60 text-sm leading-relaxed">{booking.description}</p>
            </div>
          )}

          {booking.referenceImage && (
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Reference Image</p>
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="group relative block w-full max-w-xs overflow-hidden border border-white/10
                           hover:border-brand-accent/40 transition-colors"
                title="Click to view full size"
              >
                <img src={booking.referenceImage} alt="Reference"
                  className="w-full h-40 object-cover bg-white/5 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-black/60 text-white text-xs px-3 py-1 border border-white/20">
                    View full size
                  </span>
                </div>
              </button>
            </div>
          )}

          {lightbox && (
            <ImageLightbox
              src={booking.referenceImage}
              alt={`Reference — ${booking.tattooIdea}`}
              onClose={() => setLightbox(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function MyBookings() {
  const [bookings,      setBookings]      = useState([]);
  const [reviewed,      setReviewed]      = useState(new Set());
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [ratingBooking, setRatingBooking] = useState(null); // booking open in modal

  useEffect(() => {
    // Fetch bookings and existing reviews in parallel
    Promise.all([
      api.get('/users/my-bookings'),
      api.get('/reviews/me').catch(() => ({ data: { data: { reviews: [] } } })),
    ])
      .then(([bookingsRes, reviewsRes]) => {
        const allBookings = bookingsRes.data.data.bookings;
        setBookings(allBookings);

        // Build a Set of booking IDs that already have a review
        const reviewedIds = new Set(
          reviewsRes.data.data.reviews
            .map((r) => r.appointment?._id)
            .filter(Boolean)
        );
        setReviewed(reviewedIds);

        // Auto-show modal for the first completed, unreviewed booking
        // (only once per page load — the customer can dismiss it)
        const firstUnreviewed = allBookings.find(
          (b) => b.status === 'completed' && !reviewedIds.has(b._id)
        );
        if (firstUnreviewed) {
          setRatingBooking(firstUnreviewed);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Called when a review is successfully submitted via the modal
  const handleReviewSaved = (review) => {
    const bookingId = review.appointment?._id || review.appointment;
    setReviewed((prev) => new Set([...prev, bookingId]));
    // Keep modal open briefly to show the success state; close handled by modal's Done button
  };

  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Account</p>
          <h1 className="font-display text-4xl text-white mb-2">My Bookings</h1>
          <p className="text-white/40 text-sm">Track the status of your appointment requests.</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="border border-dashed border-white/10 py-20 text-center">
            <p className="text-white/30 mb-6">You haven&apos;t submitted any booking requests yet.</p>
            <Link to="/book" className="btn-primary text-xs py-2.5 px-6">Book an Appointment</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                reviewed={reviewed}
                onRate={setRatingBooking}
              />
            ))}
          </div>
        )}

        {bookings.length > 0 && (
          <div className="mt-10 text-center">
            <Link to="/book" className="btn-outline text-xs py-2.5 px-6">+ New Booking Request</Link>
          </div>
        )}
      </div>

      {/* Review modal — auto-shown or triggered by Rate button */}
      {ratingBooking && (
        <ReviewModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSaved={handleReviewSaved}
        />
      )}
    </div>
  );
}

export default MyBookings;
