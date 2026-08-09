import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';

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
    <span className={`px-2 py-0.5 text-xs border font-medium ${STATUS_STYLES[status] ?? 'text-white/50'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-brand-accent/40
                 text-brand-accent hover:bg-brand-accent hover:text-brand-bg transition-colors duration-150"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0
                 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0
                 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06
                 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125
                 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0
                 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0
                 00-3.375-3.375H9.75" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function MyReferrals() {
  const [codeData, setCodeData]   = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [codeRes, listRes] = await Promise.all([
        api.get('/referrals/my-code'),
        api.get('/referrals/me'),
      ]);
      setCodeData(codeRes.data.data);
      setReferrals(listRes.data.data.referrals);
      setStats(listRes.data.data.stats);
    } catch (err) {
      setError(err.message || 'Failed to load referral data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={load} className="btn-outline text-xs">Try Again</button>
        </div>
      </div>
    );
  }

  const commissionPct = codeData ? Math.round((codeData.commissionRate || 0.05) * 100) : 5;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">

      {/* Header */}
      <div className="mb-10">
        <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Referral Programme</p>
        <h1 className="font-display text-3xl mb-3">Refer &amp; Earn</h1>
        <p className="text-white/50 text-sm leading-relaxed max-w-md">
          Earn <span className="text-brand-accent font-semibold">{commissionPct}%</span> when
          a friend you refer completes their first tattoo session and pays the agreed price.
        </p>
      </div>

      {/* Code + link cards */}
      {codeData && (
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <div className="bg-white/3 border border-white/8 p-5">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Your Referral Code</p>
            <p className="font-mono text-brand-accent text-2xl font-semibold tracking-[0.2em] mb-4">
              {codeData.referralCode}
            </p>
            <CopyButton text={codeData.referralCode} label="Copy Code" />
          </div>

          <div className="bg-white/3 border border-white/8 p-5">
            <p className="text-white/40 text-xs tracking-widest uppercase mb-3">Your Referral Link</p>
            {codeData.referralLink ? (
              <>
                <p className="text-white/60 text-xs font-mono break-all leading-relaxed mb-4 line-clamp-3">
                  {codeData.referralLink}
                </p>
                <CopyButton text={codeData.referralLink} label="Copy Link" />
              </>
            ) : (
              <p className="text-white/30 text-xs">Generating your link…</p>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: 'Total Referrals', value: stats.total },
            { label: 'Pending',         value: stats.pending },
            { label: 'Eligible',        value: `KES ${(stats.totalEligibleAmount || 0).toLocaleString('en-KE')}` },
            { label: 'Paid',            value: `KES ${(stats.totalPaidAmount    || 0).toLocaleString('en-KE')}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white/3 border border-white/8 p-4 text-center">
              <p className="text-white/40 text-xs tracking-widest uppercase mb-2">{label}</p>
              <p className="text-white font-semibold text-lg">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* History table */}
      <div>
        <p className="text-white/40 text-xs tracking-widest uppercase mb-4">Referral History</p>

        {referrals.length === 0 ? (
          <div className="border border-white/8 p-10 text-center">
            <p className="text-white/30 text-sm mb-2">No referrals yet</p>
            <p className="text-white/20 text-xs">
              Share your referral link and start earning commissions.
            </p>
          </div>
        ) : (
          <div className="border border-white/8 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {['Referred Customer', 'Tattoo', 'Commission', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-white/40 text-xs tracking-widest uppercase font-normal whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((r) => (
                  <tr key={r._id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                      {r.referredCustomer
                        ? `${r.referredCustomer.firstName} ${r.referredCustomer.lastName}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs max-w-[140px] truncate">
                      {r.booking?.tattooIdea || '—'}
                    </td>
                    <td className="px-4 py-3 text-white/80 whitespace-nowrap">
                      {r.commissionAmount != null
                        ? `KES ${Number(r.commissionAmount).toLocaleString('en-KE')}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-KE', {
                        year: 'numeric', month: 'short', day: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="mt-12 border-t border-white/8 pt-8">
        <p className="text-white/40 text-xs tracking-widest uppercase mb-6">How It Works</p>
        <ol className="space-y-4">
          {[
            'Share your unique referral link with a friend.',
            'Your friend registers using the link and books a tattoo session.',
            'Your friend pays the deposit and completes their tattoo session.',
            `You earn ${commissionPct}% of their agreed tattoo price as commission.`,
            'His Inks manually processes your commission payment via M-Pesa.',
          ].map((step, i) => (
            <li key={i} className="flex gap-4 text-sm">
              <span className="w-6 h-6 flex-shrink-0 rounded-full border border-brand-accent/40
                               text-brand-accent text-xs flex items-center justify-center font-semibold">
                {i + 1}
              </span>
              <span className="text-white/60 leading-relaxed pt-0.5">{step}</span>
            </li>
          ))}
        </ol>
      </div>

    </div>
  );
}

export default MyReferrals;
