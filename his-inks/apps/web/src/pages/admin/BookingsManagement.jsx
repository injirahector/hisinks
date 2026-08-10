import { useEffect, useState } from 'react';
import api from '../../services/api';
import ImageLightbox from '../../components/ImageLightbox';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'completed', 'cancelled'];

const STATUS_STYLES = {
  pending:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  confirmed: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  completed: 'text-green-400 bg-green-400/10 border-green-400/20',
  cancelled: 'text-red-400 bg-red-400/10 border-red-400/20',
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 text-sm shadow-xl
      ${type === 'success'
        ? 'bg-green-500/20 border border-green-500/40 text-green-300'
        : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Booking detail / status update drawer ────────────────────────────────────
function BookingDrawer({ booking, onClose, onStatusUpdate }) {
  const [status, setStatus]   = useState(booking.status);
  const [notes, setNotes]     = useState(booking.notes || '');
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [lightbox, setLightbox] = useState(false);

  const dirty = status !== booking.status || notes !== (booking.notes || '');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = { status };
      if (notes.trim()) payload.notes = notes.trim();
      await api.patch(`/bookings/${booking._id}/status`, payload);
      onStatusUpdate();
      onClose();
    } catch (e) {
      setError(e.message || 'Update failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#111] border-l border-white/8 h-full overflow-y-auto"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <h2 className="font-display text-lg text-white">Booking Details</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white text-xl">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Customer info */}
          <div>
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Customer</p>
            <p className="text-white font-medium">{booking.customerName}</p>
            <p className="text-white/50 text-sm">{booking.phone}</p>
            {booking.email && <p className="text-white/50 text-sm">{booking.email}</p>}
          </div>

          <div className="border-t border-white/8" />

          {/* Tattoo details */}
          <div>
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Tattoo Request</p>
            <p className="text-brand-accent text-sm font-medium mb-1">{booking.tattooIdea}</p>
            <p className="text-white/60 text-sm leading-relaxed">{booking.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
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
              <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Submitted</p>
              <p className="text-white text-sm">{fmtDate(booking.createdAt)}</p>
            </div>
            {booking.bookingLocation && (
              <div className="col-span-2">
                <p className="text-white/30 text-xs uppercase tracking-widest mb-1">Booking Location</p>
                <p className="text-white text-sm">
                  {booking.bookingLocation === 'studio' ? 'Come to Studio' : 'House Call'}
                </p>
              </div>
            )}
          </div>

          {booking.referenceImage && (
            <div>
              <p className="text-white/30 text-xs uppercase tracking-widest mb-2">Reference Image</p>
              <button
                type="button"
                onClick={() => setLightbox(true)}
                className="group relative block w-full overflow-hidden border border-white/10
                           hover:border-brand-accent/40 transition-colors"
                title="Click to view full size"
              >
                <img src={booking.referenceImage} alt="Reference"
                  className="w-full h-48 object-cover bg-white/5 group-hover:opacity-80 transition-opacity" />
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

          <div className="border-t border-white/8" />

          {/* Status update */}
          <div>
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Update Status</p>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {STATUS_OPTIONS.filter((s) => s !== 'all').map((s) => (
                <button key={s} onClick={() => setStatus(s)}
                  className={`py-2 text-xs tracking-widest uppercase border transition-colors
                    ${status === s
                      ? `${STATUS_STYLES[s]} border-current`
                      : 'border-white/10 text-white/30 hover:text-white hover:border-white/30'}`}>
                  {s}
                </button>
              ))}
            </div>

            <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">
              Admin Notes (optional)
            </label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Add a note for this booking…"
              className="w-full bg-white/5 border border-white/10 px-3 py-2.5 text-white text-sm
                         placeholder-white/20 focus:outline-none focus:border-brand-accent/60
                         transition-colors resize-none" />

            {error && <p className="text-red-400 text-xs mt-2">{error}</p>}

            <button onClick={handleSave} disabled={saving || !dirty}
              className="mt-4 w-full py-2.5 bg-brand-accent text-brand-bg text-xs tracking-widest
                         uppercase font-semibold hover:opacity-90 disabled:opacity-40
                         disabled:cursor-not-allowed transition-opacity">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function BookingsManagement() {
  const [bookings, setBookings]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('all');
  const [selected, setSelected]   = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = () => {
    setLoading(true);
    api.get('/bookings?limit=200')
      .then((r) => setBookings(r.data.data.bookings))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  const counts = STATUS_OPTIONS.reduce((acc, s) => {
    acc[s] = s === 'all' ? bookings.length : bookings.filter((b) => b.status === s).length;
    return acc;
  }, {});

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">Manage</p>
        <h1 className="font-display text-3xl text-white">Bookings</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_OPTIONS.map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors
              ${filter === s
                ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                : 'border-white/10 text-white/40 hover:text-white hover:border-white/30'}`}>
            {s} <span className="ml-1 opacity-60">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-white/10 py-20 text-center">
          <p className="text-white/30 text-sm">No {filter === 'all' ? '' : filter} bookings.</p>
        </div>
      ) : (
        <div className="border border-white/8 overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-white/3 border-b border-white/8
                          text-white/30 text-xs tracking-widest uppercase">
            <div className="col-span-3">Customer</div>
            <div className="col-span-2">Phone</div>
            <div className="col-span-3">Tattoo Idea</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Status</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-white/8">
            {filtered.map((b) => (
              <button key={b._id} onClick={() => setSelected(b)}
                className="w-full grid grid-cols-12 gap-3 px-4 py-3.5 hover:bg-white/3
                           transition-colors text-left group">
                <div className="col-span-3 min-w-0">
                  <p className="text-white text-sm truncate group-hover:text-brand-accent transition-colors">
                    {b.customerName}
                  </p>
                </div>
                <div className="col-span-2 min-w-0">
                  <p className="text-white/50 text-sm truncate">{b.phone}</p>
                </div>
                <div className="col-span-3 min-w-0">
                  <p className="text-white/70 text-sm truncate">{b.tattooIdea}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-white/50 text-sm">{fmtDate(b.preferredDate)}</p>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 border ${STATUS_STYLES[b.status] || 'text-white/40 bg-white/5 border-white/10'}`}>
                    {b.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <BookingDrawer
          booking={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={() => {
            showToast('Booking status updated.');
            load();
          }}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default BookingsManagement;
