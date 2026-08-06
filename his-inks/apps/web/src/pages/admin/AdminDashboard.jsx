import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

const STATUS_COLORS = {
  pending:   'text-yellow-400 bg-yellow-400/10',
  confirmed: 'text-blue-400 bg-blue-400/10',
  completed: 'text-green-400 bg-green-400/10',
  cancelled: 'text-red-400 bg-red-400/10',
};

function StatCard({ label, value, accent, loading }) {
  return (
    <div className={`border p-6 ${accent ? 'border-brand-accent/40 bg-brand-accent/5' : 'border-white/8 bg-white/3'}`}>
      <p className="text-white/40 text-xs tracking-widest uppercase mb-3">{label}</p>
      {loading ? (
        <div className="h-8 w-12 bg-white/10 animate-pulse rounded" />
      ) : (
        <p className={`font-display text-4xl ${accent ? 'text-brand-accent' : 'text-white'}`}>{value ?? 0}</p>
      )}
    </div>
  );
}

function AdminDashboard() {
  const [tattoos, setTattoos]   = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/tattoos?limit=5'),
      api.get('/bookings?limit=100'),
    ])
      .then(([tRes, bRes]) => {
        setTattoos(tRes.data.data.tattoos);
        setBookings(bRes.data.data.bookings);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const pending   = bookings.filter((b) => b.status === 'pending').length;
  const confirmed = bookings.filter((b) => b.status === 'confirmed').length;
  const completed = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-10">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-2">Overview</p>
        <h1 className="font-display text-3xl text-white">Dashboard</h1>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatCard label="Total Tattoos"          value={tattoos.length} loading={loading} accent />
        <StatCard label="Pending Bookings"        value={pending}        loading={loading} />
        <StatCard label="Confirmed Appointments"  value={confirmed}      loading={loading} />
        <StatCard label="Completed"               value={completed}      loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Tattoos */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/80 text-sm tracking-widest uppercase">Recent Tattoos</h2>
            <Link to="/admin/tattoos" className="text-brand-accent text-xs tracking-widest uppercase hover:underline">
              View all
            </Link>
          </div>
          <div className="border border-white/8 divide-y divide-white/8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <div className="w-10 h-10 bg-white/10 animate-pulse flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 bg-white/10 animate-pulse rounded w-3/4" />
                    <div className="h-2.5 bg-white/10 animate-pulse rounded w-1/2" />
                  </div>
                </div>
              ))
            ) : tattoos.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">No tattoos yet.</div>
            ) : (
              tattoos.slice(0, 5).map((t) => (
                <div key={t._id} className="flex items-center gap-3 p-3 hover:bg-white/3 transition-colors">
                  <img src={t.image} alt={t.title} className="w-10 h-10 object-cover flex-shrink-0 bg-white/5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">{t.title}</p>
                    <p className="text-white/40 text-xs">{t.category}</p>
                  </div>
                  <p className="text-white/30 text-xs flex-shrink-0">{fmtDate(t.createdAt)}</p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Recent Bookings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white/80 text-sm tracking-widest uppercase">Recent Bookings</h2>
            <Link to="/admin/bookings" className="text-brand-accent text-xs tracking-widest uppercase hover:underline">
              View all
            </Link>
          </div>
          <div className="border border-white/8 divide-y divide-white/8">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-3 space-y-1.5">
                  <div className="h-3 bg-white/10 animate-pulse rounded w-3/4" />
                  <div className="h-2.5 bg-white/10 animate-pulse rounded w-1/2" />
                </div>
              ))
            ) : bookings.length === 0 ? (
              <div className="p-6 text-center text-white/30 text-sm">No bookings yet.</div>
            ) : (
              bookings.slice(0, 5).map((b) => (
                <div key={b._id} className="flex items-center justify-between p-3 hover:bg-white/3 transition-colors">
                  <div className="min-w-0">
                    <p className="text-white text-sm truncate">{b.customerName}</p>
                    <p className="text-white/40 text-xs truncate">{b.tattooIdea}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 ml-3 flex-shrink-0 ${STATUS_COLORS[b.status] || 'text-white/40'}`}>
                    {b.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default AdminDashboard;
