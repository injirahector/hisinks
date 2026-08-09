import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  eligible:  'bg-green-400/10  text-green-400  border-green-400/20',
  paid:      'bg-brand-accent/10 text-brand-accent border-brand-accent/20',
  cancelled: 'bg-white/5 text-white/30 border-white/10',
};
const STATUS_LABEL = { pending: 'Pending', eligible: 'Eligible', paid: 'Paid', cancelled: 'Cancelled' };

function StatusBadge({ status }) {
  return (
    <span className={`px-2 py-0.5 text-xs border font-medium ${STATUS_STYLES[status] ?? 'text-white/40'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Mark as Paid dialog ───────────────────────────────────────────────────────
function PayDialog({ referral, onClose, onConfirm, loading }) {
  const [ref, setRef]   = useState('');
  const [notes, setNotes] = useState('');
  const [err, setErr]   = useState('');

  if (!referral) return null;

  const referrerName = referral.referrer
    ? `${referral.referrer.firstName} ${referral.referrer.lastName}`
    : '—';

  const handleConfirm = () => {
    if (!ref.trim()) { setErr('M-Pesa reference is required.'); return; }
    setErr('');
    onConfirm(referral._id, ref.trim(), notes.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#111] border border-white/10 w-full max-w-md p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-lg text-white">Referral Commission</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white transition-colors"
            aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        <div className="space-y-3 mb-6 text-sm">
          <div className="flex justify-between">
            <span className="text-white/40">Referrer</span>
            <span className="text-white">{referrerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Referred Customer</span>
            <span className="text-white">
              {referral.referredCustomer
                ? `${referral.referredCustomer.firstName} ${referral.referredCustomer.lastName}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/40">Tattoo Amount</span>
            <span className="text-white">
              {referral.bookingAmount != null
                ? `KES ${Number(referral.bookingAmount).toLocaleString('en-KE')}`
                : '—'}
            </span>
          </div>
          <div className="flex justify-between border-t border-white/8 pt-3">
            <span className="text-white/40">Commission</span>
            <span className="text-brand-accent font-semibold text-base">
              {referral.commissionAmount != null
                ? `KES ${Number(referral.commissionAmount).toLocaleString('en-KE')}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Payment method (display only) */}
        <div className="mb-4">
          <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">
            Payment Method
          </label>
          <div className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white/60 text-sm">
            M-Pesa
          </div>
        </div>

        {/* M-Pesa reference */}
        <div className="mb-4">
          <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">
            M-Pesa Reference <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={ref}
            onChange={(e) => { setRef(e.target.value); setErr(''); }}
            placeholder="e.g. SLK1234XYZ"
            className={`w-full bg-white/5 border px-4 py-2.5 text-white placeholder-white/20
                        focus:outline-none transition-colors
                        ${err ? 'border-red-500/60' : 'border-white/10 focus:border-brand-accent'}`}
          />
          {err && <p className="mt-1 text-red-400 text-xs">{err}</p>}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-white/40 text-xs tracking-widest uppercase mb-2">
            Notes <span className="text-white/20 normal-case tracking-normal text-xs">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional notes…"
            className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white
                       placeholder-white/20 focus:outline-none focus:border-brand-accent
                       transition-colors resize-none text-sm"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2 text-sm border border-white/10 text-white/50
                       hover:text-white hover:border-white/30 transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Confirm Paid'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const STATUS_FILTERS = [
  { value: '',          label: 'All' },
  { value: 'pending',   label: 'Pending' },
  { value: 'eligible',  label: 'Eligible' },
  { value: 'paid',      label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' },
];

function ReferralsManagement() {
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('');
  const [page, setPage]         = useState(1);

  // Pay dialog state
  const [dialogReferral, setDialogReferral] = useState(null);
  const [payLoading, setPayLoading]         = useState(false);
  const [payError, setPayError]             = useState('');
  const [successId, setSuccessId]           = useState('');

  const load = useCallback(async (pg = page, st = filter) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/admin/referrals', { params: { status: st || undefined, page: pg, limit: 20 } });
      setData(res.data.data);
    } catch (err) {
      setError(err.message || 'Failed to load referrals.');
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { load(page, filter); }, [page, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = (val) => {
    setFilter(val);
    setPage(1);
  };

  const handleMarkPaid = async (referralId, paymentReference, notes) => {
    setPayLoading(true);
    setPayError('');
    try {
      await api.patch(`/admin/referrals/${referralId}/pay`, { paymentReference, notes });
      setSuccessId(referralId);
      setDialogReferral(null);
      // Reload to reflect updated status
      load(page, filter);
      setTimeout(() => setSuccessId(''), 3000);
    } catch (err) {
      setPayError(err.message || 'Failed to mark as paid.');
    } finally {
      setPayLoading(false);
    }
  };

  const summary = data?.summary;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">

      {/* Page header */}
      <div className="mb-8">
        <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-2">Admin</p>
        <h1 className="font-display text-2xl text-white">Referral Management</h1>
      </div>

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Total',     value: summary.total },
            { label: 'Pending',   value: summary.pending },
            { label: 'Eligible',  value: summary.eligible },
            { label: 'Paid',      value: summary.paid },
            { label: 'Cancelled', value: summary.cancelled },
            { label: 'Total Commission',
              value: `KES ${Number(summary.totalCommission || 0).toLocaleString('en-KE')}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/3 border border-white/8 p-4 text-center">
              <p className="text-white/40 text-[10px] tracking-widest uppercase mb-1.5">{label}</p>
              <p className="text-white font-semibold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Pay error */}
      {payError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {payError}
        </div>
      )}

      {/* Success banner */}
      {successId && (
        <div className="mb-4 px-4 py-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm">
          Referral marked as paid successfully.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {STATUS_FILTERS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => handleFilterChange(value)}
            className={`px-4 py-1.5 text-xs tracking-widest uppercase transition-colors
                        ${filter === value
                          ? 'bg-brand-accent text-brand-bg font-semibold'
                          : 'border border-white/10 text-white/50 hover:text-white hover:border-white/30'
                        }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="border border-white/8 p-10 text-center">
          <p className="text-red-400 text-sm mb-4">{error}</p>
          <button onClick={() => load(page, filter)} className="btn-outline text-xs">Retry</button>
        </div>
      ) : !data?.referrals?.length ? (
        <div className="border border-white/8 p-10 text-center">
          <p className="text-white/30 text-sm">No referrals found.</p>
        </div>
      ) : (
        <>
          <div className="border border-white/8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Referrer', 'Referred Customer', 'Booking', 'Tattoo Amount', 'Commission', 'Status', 'Date', 'Action'].map((h) => (
                    <th key={h}
                        className="px-4 py-3 text-left text-white/40 text-xs tracking-widest uppercase font-normal whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.referrals.map((r) => (
                  <tr key={r._id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    {/* Referrer */}
                    <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                      {r.referrer
                        ? `${r.referrer.firstName} ${r.referrer.lastName}`
                        : '—'}
                    </td>
                    {/* Referred customer */}
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                      {r.referredCustomer
                        ? `${r.referredCustomer.firstName} ${r.referredCustomer.lastName}`
                        : '—'}
                    </td>
                    {/* Booking idea */}
                    <td className="px-4 py-3 text-white/50 text-xs max-w-[120px] truncate">
                      {r.booking?.tattooIdea || '—'}
                    </td>
                    {/* Tattoo amount */}
                    <td className="px-4 py-3 text-white/70 whitespace-nowrap">
                      {r.bookingAmount != null
                        ? `KES ${Number(r.bookingAmount).toLocaleString('en-KE')}`
                        : '—'}
                    </td>
                    {/* Commission */}
                    <td className="px-4 py-3 text-brand-accent font-semibold whitespace-nowrap">
                      {r.commissionAmount != null
                        ? `KES ${Number(r.commissionAmount).toLocaleString('en-KE')}`
                        : '—'}
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                      {r.status === 'paid' && r.paymentReference && (
                        <p className="text-white/25 text-[10px] mt-0.5 font-mono">{r.paymentReference}</p>
                      )}
                    </td>
                    {/* Date */}
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-KE', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3">
                      {r.status === 'eligible' ? (
                        <button
                          onClick={() => { setDialogReferral(r); setPayError(''); }}
                          className="px-3 py-1.5 text-xs bg-brand-accent text-brand-bg font-semibold
                                     hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                          Mark as Paid
                        </button>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
              <p className="text-white/30 text-xs">
                Page {data.pagination.page} of {data.pagination.totalPages}
                &nbsp;({data.pagination.total} total)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.pagination.page <= 1}
                  className="px-3 py-1.5 text-xs border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 transition-colors disabled:opacity-30"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                  disabled={data.pagination.page >= data.pagination.totalPages}
                  className="px-3 py-1.5 text-xs border border-white/10 text-white/50
                             hover:text-white hover:border-white/30 transition-colors disabled:opacity-30"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Pay dialog */}
      <PayDialog
        referral={dialogReferral}
        onClose={() => setDialogReferral(null)}
        onConfirm={handleMarkPaid}
        loading={payLoading}
      />

    </div>
  );
}

export default ReferralsManagement;
