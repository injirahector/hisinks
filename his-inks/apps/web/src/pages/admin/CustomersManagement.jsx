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
function Avatar({ firstName, lastName, deleted }) {
  const initials = `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase();
  return (
    <div
      className={`w-9 h-9 flex-shrink-0 flex items-center justify-center
                  border text-xs font-semibold tracking-wider
                  ${deleted
                    ? 'bg-white/5 border-white/10 text-white/20'
                    : 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent'}`}
    >
      {initials || '?'}
    </div>
  );
}

// ── Deleted badge ─────────────────────────────────────────────────────────────
function DeletedBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                 text-[10px] font-medium tracking-widest uppercase
                 bg-red-500/10 border border-red-500/25 text-red-400"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
      Deleted
    </span>
  );
}

// ── Customer detail drawer ────────────────────────────────────────────────────
function CustomerDrawer({ customer, onClose }) {
  const isDeleted = Boolean(customer.deletedAt);

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

          {/* Deleted banner */}
          {isDeleted && (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/25 bg-red-500/8 px-4 py-3">
              <svg className="h-4 w-4 shrink-0 mt-0.5 text-red-400" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0
                     2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898
                     0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
              </svg>
              <div>
                <p className="text-red-300 text-sm font-medium">Account Deleted</p>
                <p className="text-red-400/60 text-xs mt-0.5">
                  Deleted on {fmtDate(customer.deletedAt)}. Personal data has been
                  anonymized. Historical records are preserved.
                </p>
              </div>
            </div>
          )}

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className={`w-14 h-14 flex items-center justify-center border
                          text-lg font-semibold tracking-wider
                          ${isDeleted
                            ? 'bg-white/5 border-white/10 text-white/20'
                            : 'bg-brand-accent/15 border-brand-accent/30 text-brand-accent'}`}
            >
              {`${customer.firstName?.[0] ?? ''}${customer.lastName?.[0] ?? ''}`.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={`font-medium text-base ${isDeleted ? 'text-white/30' : 'text-white'}`}>
                  {customer.firstName} {customer.lastName}
                </p>
                {isDeleted && <DeletedBadge />}
              </div>
              <p className="text-white/40 text-xs tracking-widest uppercase mt-0.5">Customer</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <Field label="Email"    value={customer.email} />
            <Field label="Phone"    value={customer.phone || '—'} />
            <Field label="Location" value={customer.location || '—'} />
            <Field label="Joined"   value={fmtDate(customer.createdAt)} />
            {isDeleted && (
              <Field
                label="Deleted On"
                value={fmtDate(customer.deletedAt)}
                valueClass="text-red-400"
              />
            )}
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

// ── Filter tabs ───────────────────────────────────────────────────────────────
const FILTERS = [
  { label: 'Active',  value: 'false' },
  { label: 'Deleted', value: 'true'  },
  { label: 'All',     value: 'all'   },
];

// ── Main page ─────────────────────────────────────────────────────────────────
function CustomersManagement() {
  const [customers,     setCustomers]     = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [pagination,    setPagination]    = useState(null);
  const [selected,      setSelected]      = useState(null);
  const [deletedFilter, setDeletedFilter] = useState('false'); // 'false' | 'true' | 'all'

  const debouncedSearch = useDebounce(search, 400);
  const LIMIT = 20;

  const load = useCallback((pageNum = 1, q = '', deleted = 'false') => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: pageNum, limit: LIMIT, deleted });
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

  // Reload when search term or filter changes — reset to page 1
  useEffect(() => {
    load(1, debouncedSearch, deletedFilter);
  }, [debouncedSearch, deletedFilter, load]);

  const handleFilterChange = (val) => {
    setDeletedFilter(val);
    setSearch('');
  };

  const handlePrev = () => { if (page > 1) load(page - 1, debouncedSearch, deletedFilter); };
  const handleNext = () => {
    if (pagination && page < pagination.totalPages) load(page + 1, debouncedSearch, deletedFilter);
  };

  const filterLabel =
    deletedFilter === 'true' ? 'deleted' :
    deletedFilter === 'all'  ? 'total'   : 'active';

  return (
    <div className="p-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">Manage</p>
        <h1 className="font-display text-3xl text-white">Customers</h1>
        {pagination && !loading && (
          <p className="text-white/30 text-sm mt-1">
            {pagination.total} {filterLabel}{' '}
            {pagination.total === 1 ? 'customer' : 'customers'}
          </p>
        )}
      </div>

      {/* ── Filter tabs ────────────────────────────────────────────────────── */}
      <div className="flex gap-1 mb-6 border-b border-white/8 pb-px">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`px-4 py-2 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px
              ${deletedFilter === f.value
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-white/35 hover:text-white/70'}`}
          >
            {f.label}
          </button>
        ))}
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
            onChange={(e) => setSearch(e.target.value)}
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
              {search
                ? `No customers match "${search}".`
                : deletedFilter === 'true'
                ? 'No deleted customer accounts.'
                : 'No registered customers yet.'}
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
            {customers.map((c) => {
              const isDeleted = Boolean(c.deletedAt);
              return (
                <div
                  key={c._id}
                  className={`grid grid-cols-[auto_1fr_1fr_auto_auto] gap-4 items-center
                               px-4 py-3 transition-colors
                               ${isDeleted
                                 ? 'opacity-55 hover:opacity-75'
                                 : 'hover:bg-white/[0.02]'}`}
                >
                  {/* Avatar */}
                  <Avatar firstName={c.firstName} lastName={c.lastName} deleted={isDeleted} />

                  {/* Name + badge */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium truncate ${isDeleted ? 'text-white/30' : 'text-white'}`}>
                        {c.firstName} {c.lastName}
                      </p>
                      {isDeleted && <DeletedBadge />}
                    </div>
                    {c.phone && (
                      <p className="text-white/30 text-xs truncate mt-0.5">{c.phone}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="min-w-0">
                    <p className={`text-sm truncate ${isDeleted ? 'text-white/25' : 'text-white/60'}`}>
                      {c.email}
                    </p>
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
              );
            })}
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
