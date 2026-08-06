import { useState, useEffect } from 'react';
import api from '../../services/api';

const STARS = [1, 2, 3, 4, 5];

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {STARS.map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-brand-accent' : 'text-white/15'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function ReviewsManagement() {
  const [reviews,     setReviews]     = useState([]);
  const [stats,       setStats]       = useState(null);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('');        // '' | 'true' | 'false'
  const [selected,    setSelected]    = useState(null);
  const [replyText,   setReplyText]   = useState('');
  const [replying,    setReplying]    = useState(false);
  const [toggling,    setToggling]    = useState(false);
  const [actionMsg,   setActionMsg]   = useState('');
  const [actionErr,   setActionErr]   = useState('');

  // ── Load reviews list ────────────────────────────────────────────────────────
  const loadList = async (visibility = filter) => {
    setLoading(true);
    try {
      const params = visibility !== '' ? `?isVisible=${visibility}` : '';
      const res = await api.get(`/admin/reviews${params}`);
      setReviews(res.data.data.reviews);
      setTotal(res.data.pagination.total);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  // ── Load stats ───────────────────────────────────────────────────────────────
  const loadStats = async () => {
    try {
      const res = await api.get('/reviews/stats');
      setStats(res.data.data.stats);
    } catch {
      // silently fail
    }
  };

  useEffect(() => {
    loadList();
    loadStats();
  }, [filter]);

  // ── Select a review for detail view ─────────────────────────────────────────
  const openDetail = (review) => {
    setSelected(review);
    setReplyText(review.artistReply || '');
    setActionMsg('');
    setActionErr('');
  };

  // ── Admin reply ──────────────────────────────────────────────────────────────
  const handleReply = async (e) => {
    e.preventDefault();
    setActionErr('');
    if (!replyText.trim()) return setActionErr('Reply text is required.');
    setReplying(true);
    try {
      const res = await api.patch(`/admin/reviews/${selected._id}/reply`, {
        artistReply: replyText,
      });
      const updated = res.data.data.review;
      setSelected(updated);
      setReviews((prev) => prev.map((r) => r._id === updated._id ? updated : r));
      setActionMsg('Reply saved.');
    } catch (err) {
      setActionErr(err.message || 'Failed to save reply.');
    } finally {
      setReplying(false);
    }
  };

  // ── Toggle visibility ────────────────────────────────────────────────────────
  const handleToggle = async (id, current) => {
    setToggling(true);
    setActionErr('');
    try {
      const res = await api.patch(`/admin/reviews/${id}/visibility`, {
        isVisible: !current,
      });
      const updated = res.data.data.review;
      setReviews((prev) => prev.map((r) => r._id === updated._id ? updated : r));
      if (selected?._id === id) setSelected(updated);
      setActionMsg(`Review ${updated.isVisible ? 'made visible' : 'hidden'}.`);
    } catch (err) {
      setActionErr(err.message || 'Failed to update visibility.');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left: stats + list ──────────────────────────────────────────────── */}
      <div className="w-80 flex-shrink-0 border-r border-white/8 flex flex-col">

        {/* Stats bar */}
        {stats && (
          <div className="px-5 py-4 border-b border-white/8 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs uppercase tracking-widest">Avg. Rating</span>
              <span className="text-brand-accent font-display text-lg">
                {stats.averageRating} <span className="text-sm text-white/30">/ 5</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/40 text-xs uppercase tracking-widest">Total</span>
              <span className="text-white text-sm">{stats.totalReviews} reviews</span>
            </div>
            {/* Distribution bar */}
            <div className="pt-1 space-y-0.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star] || 0;
                const pct   = stats.totalReviews > 0
                  ? Math.round((count / stats.totalReviews) * 100) : 0;
                return (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-white/30 text-[10px] w-3">{star}</span>
                    <div className="flex-1 h-1 bg-white/5">
                      <div
                        className="h-full bg-brand-accent/60 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-white/25 text-[10px] w-4 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filter + count */}
        <div className="px-5 py-3 border-b border-white/8">
          <p className="text-white/25 text-xs mb-2">{total} total</p>
          <select
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setSelected(null); }}
            className="w-full bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-2
                       focus:outline-none focus:border-brand-accent"
          >
            <option value="">All reviews</option>
            <option value="true">Visible only</option>
            <option value="false">Hidden only</option>
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-white/30 text-xs px-5 py-4">Loading…</p>
          )}
          {!loading && reviews.length === 0 && (
            <p className="text-white/25 text-xs px-5 py-4">No reviews found.</p>
          )}
          {reviews.map((r) => (
            <button
              key={r._id}
              onClick={() => openDetail(r)}
              className={`w-full text-left px-5 py-4 border-b border-white/5 transition-colors
                ${selected?._id === r._id
                  ? 'bg-brand-accent/10 border-l-2 border-l-brand-accent'
                  : 'hover:bg-white/3'}`}
            >
              <div className="flex items-center justify-between mb-1 gap-2">
                <span className="text-white text-sm font-medium truncate">
                  {r.customer?.firstName} {r.customer?.lastName}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {!r.isVisible && (
                    <span className="text-[10px] text-white/30 border border-white/10 px-1.5 py-0.5">
                      Hidden
                    </span>
                  )}
                  <div className="flex gap-0.5">
                    {STARS.map((s) => (
                      <svg key={s} className={`w-3 h-3 ${s <= r.rating ? 'text-brand-accent' : 'text-white/10'}`}
                        fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-white/40 text-xs truncate">
                {r.appointment?.tattooIdea}
              </p>
              <p className="text-white/30 text-xs truncate mt-0.5 italic">{r.comment}</p>
              <p className="text-white/20 text-[10px] mt-1">{fmtDate(r.createdAt)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: detail panel ──────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {!selected && (
          <div className="h-full flex items-center justify-center">
            <p className="text-white/20 text-sm">Select a review to manage it</p>
          </div>
        )}

        {selected && (
          <div className="px-8 py-8 max-w-2xl">

            {/* Customer + meta */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Customer</p>
                <div className="flex items-center gap-3">
                  {selected.customer?.profileImage ? (
                    <img src={selected.customer.profileImage} alt=""
                      className="w-9 h-9 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-brand-accent/20 border border-brand-accent/30
                                    flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-accent text-xs font-medium">
                        {selected.customer?.firstName?.[0]}{selected.customer?.lastName?.[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {selected.customer?.firstName} {selected.customer?.lastName}
                    </p>
                    <p className="text-white/35 text-xs">{selected.customer?.email}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/25 text-xs">{fmtDate(selected.createdAt)}</p>
                <p className="text-white/35 text-xs mt-0.5">
                  {selected.appointment?.tattooIdea}
                </p>
              </div>
            </div>

            {/* Review content */}
            <div className="border border-white/10 p-6 mb-6 space-y-3">
              <div className="flex items-center gap-3">
                <StarDisplay rating={selected.rating} />
                <span className="text-white/40 text-sm">{selected.rating}/5</span>
              </div>
              {selected.title && (
                <p className="text-white font-medium text-lg">{selected.title}</p>
              )}
              <p className="text-white/70 text-sm leading-relaxed">{selected.comment}</p>

              {/* Images */}
              {selected.images?.length > 0 && (
                <div className="flex gap-2 flex-wrap pt-1">
                  {selected.images.map((img, i) => (
                    <img key={i} src={img} alt={`Review image ${i + 1}`}
                      className="w-20 h-20 object-cover border border-white/10" />
                  ))}
                </div>
              )}
            </div>

            {/* Visibility toggle */}
            <div className="flex items-center justify-between mb-6 px-4 py-3 border border-white/10 bg-white/3">
              <div>
                <p className="text-white/60 text-sm">
                  Status:{' '}
                  <span className={selected.isVisible ? 'text-green-400' : 'text-white/30'}>
                    {selected.isVisible ? 'Visible to public' : 'Hidden from public'}
                  </span>
                </p>
              </div>
              <button
                onClick={() => handleToggle(selected._id, selected.isVisible)}
                disabled={toggling}
                className={`text-xs px-4 py-2 border transition-colors disabled:opacity-40 ${
                  selected.isVisible
                    ? 'border-red-500/30 text-red-400 hover:bg-red-500/10'
                    : 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                }`}
              >
                {toggling ? 'Updating…' : selected.isVisible ? 'Hide Review' : 'Make Visible'}
              </button>
            </div>

            {/* Existing reply */}
            {selected.artistReply && (
              <div className="bg-brand-accent/5 border border-brand-accent/20 px-5 py-4 mb-6">
                <p className="text-brand-accent text-xs uppercase tracking-widest mb-2">
                  Your Current Reply
                </p>
                <p className="text-white/70 text-sm leading-relaxed">{selected.artistReply}</p>
              </div>
            )}

            {/* Reply form */}
            <div>
              <p className="text-white/40 text-xs uppercase tracking-widest mb-3">
                {selected.artistReply ? 'Update Reply' : 'Add a Reply'}
              </p>
              <form onSubmit={handleReply} className="space-y-3">
                <textarea
                  value={replyText}
                  onChange={(e) => { setReplyText(e.target.value); setActionMsg(''); setActionErr(''); }}
                  maxLength={1000}
                  rows={4}
                  placeholder="Write a reply to this customer's review…"
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white text-sm
                             placeholder-white/20 focus:outline-none focus:border-brand-accent resize-none"
                />
                <p className="text-white/20 text-xs text-right">{replyText.length}/1000</p>

                {actionErr && (
                  <p className="text-red-400 text-sm px-4 py-2 bg-red-500/10 border border-red-500/20">
                    {actionErr}
                  </p>
                )}
                {actionMsg && (
                  <p className="text-green-400 text-sm">{actionMsg}</p>
                )}

                <button
                  type="submit"
                  disabled={replying}
                  className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50"
                >
                  {replying ? 'Saving…' : selected.artistReply ? 'Update Reply' : 'Post Reply'}
                </button>
              </form>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default ReviewsManagement;
