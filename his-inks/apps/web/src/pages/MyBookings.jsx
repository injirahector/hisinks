import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import ImageLightbox from '../components/ImageLightbox';

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

function BookingCard({ booking }) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState(false);
  const s = STATUS_STYLES[booking.status] || STATUS_STYLES.pending;

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

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    api.get('/users/my-bookings')
      .then((r) => setBookings(r.data.data.bookings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-3xl mx-auto px-6">
        <div className="mb-10">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Account</p>
          <h1 className="font-display text-4xl text-white mb-2">My Bookings</h1>
          <p className="text-white/40 text-sm">Track the status of your appointment requests.</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
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
            {bookings.map((b) => <BookingCard key={b._id} booking={b} />)}
          </div>
        )}

        {bookings.length > 0 && (
          <div className="mt-10 text-center">
            <Link to="/book" className="btn-outline text-xs py-2.5 px-6">+ New Booking Request</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookings;
