import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Avatar({ firstName, lastName }) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center
                    bg-brand-accent/15 border border-brand-accent/30 text-brand-accent
                    text-xs font-semibold tracking-wider">
      {initials || '?'}
    </div>
  );
}

// ── Customer detail drawer ────────────────────────────────────────────────────
function CustomerDrawer({ customer, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="relative w-full max-w-sm bg-[#111] border-l border-white/10
                   h-full overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/8">
          <p className="text-white font-display text-lg">Customer Details</p>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center
                            bg-brand-accent/15 border border-brand-accent/30
                            text-brand-accent text-lg font-semibold tracking-wider">
              {`${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
            </div>
            <div>
              <p className="text-white font-medium text-base">
                {customer.firstName} {customer.lastName}
              </p>
              <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">Customer</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <Field label="Email"    value={customer.email} />
            <Field label="Phone"    value={customer.phone  || '—'} />
            <Field label="Location" value={customer.location || '—'} />
            <Field label="Joined"   value={fmtDate(customer.createdAt)} />
            <Field
              label="Verified"
              value={customer.isVerified ? 'Yes' : 'No'}
              valueClass={customer.isVerified ? 'text-green-400' : 'text-white/40'}
            />
          </div>

          {/* Bio */}
          {customer.bio && (
            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-2">Bio</p>
              <p className="text-white/60 text-sm leading-relaxed">{customer.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, valueClass = 'text-white/70' }) {
  return (
    <div>
      <p className="text-white/30 text-xs tracking-widest uppercase mb-1">{label}</p>
      <p className={`text-sm ${valueClass}`}>{value}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function CustomersManagement() {
  const [customers,  setCustomers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selected,   setSelected]   = useState(null);

  const debouncedSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback((pageNum = 1, q = '') => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: pageNum, limit: LIMIT });
    if (q) params.set('search', q);

    api.get(`/users?${params.toString()}`)
      .then((r) => {
        setCustomers(r.data.data.users);
        setPagination(r.data.pagination);
        setPage(pageNum);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Reload when search term changes — reset to page 1
  useEffect(() => {
    load(1, debouncedSearch);
  }, [debouncedSearch, load]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handlePrev = () => { if (page > 1) load(page - 1, debouncedSearch); };
  const handleNext = () => {
    if (pagination && page < pagination.totalPages) load(page + 1, debouncedSearch);
  };

  return (
    <div className="p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">Manage</p>
        <h1 className="font-display text-3xl text-white">Customers</h1>
        {pagination && !loading && (
          <p className="text-white/30 text-sm mt-1">
            {pagination.total} registered {pagination.total === 1 ? 'customer' : 'customers'}
          </p>
        )}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────────── */}
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25"
            fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search by name, email or phone…"
            className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-white text-sm
                       placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="border border-white/8 overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center
                        px-4 py-3 bg-white/[0.02] border-b border-white/8
                        text-white/30 text-xs tracking-widest uppercase">
          <div className="w-9" />
          <div>Name</div>
          <div>Email</div>
          <div className="hidden sm:block">Joined</div>
          <div />
        </div>

        {/* Rows */}
        {loading ? (
          <div className="divide-y divide-white/5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-4 py-3">
                <div className="w-9 h-9 bg-white/5 animate-pulse" />
                <div className="h-3 bg-white/8 animate-pulse rounded w-3/4" />
                <div className="h-3 bg-white/8 animate-pulse rounded w-2/3" />
                <div className="hidden sm:block h-3 bg-white/8 animate-pulse rounded w-20" />
                <div className="h-7 w-14 bg-white/5 animate-pulse rounded" />
              </div>
            ))}
          </div>
        ) : customers.length === 0 ? (
          <div className="py-24 text-center">
            <p className="text-white/30 text-sm">
              {search ? `No customers match "${search}".` : 'No registered customers yet.'}
            </p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-3 text-brand-accent/70 text-xs hover:text-brand-accent transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {customers.map((c) => (
              <div
                key={c._id}
                className="grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center px-4 py-3
                           hover:bg-white/[0.02] transition-colors"
              >
                {/* Avatar */}
                <Avatar firstName={c.firstName} lastName={c.lastName} />

                {/* Name + phone */}
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {c.firstName} {c.lastName}
                  </p>
                  {c.phone && (
                    <p className="text-white/30 text-xs truncate mt-0.5">{c.phone}</p>
                  )}
                </div>

                {/* Email */}
                <div className="min-w-0">
                  <p className="text-white/60 text-sm truncate">{c.email}</p>
                </div>

                {/* Joined date */}
                <div className="hidden sm:block text-white/30 text-xs whitespace-nowrap">
                  {fmtDate(c.createdAt)}
                </div>

                {/* View button */}
                <button
                  onClick={() => setSelected(c)}
                  className="px-3 py-1.5 text-xs tracking-widest uppercase border border-white/10
                             text-white/50 hover:text-white hover:border-white/30 transition-colors
                             whitespace-nowrap"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-white/25 text-xs">
            Page {page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              onClick={handlePrev}
              disabled={page <= 1}
              className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10
                         text-white/50 hover:text-white hover:border-white/30 transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              onClick={handleNext}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10
                         text-white/50 hover:text-white hover:border-white/30 transition-colors
                         disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* ── Detail drawer ──────────────────────────────────────────────────── */}
      {selected && (
        <CustomerDrawer customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

export default CustomersManagement;
