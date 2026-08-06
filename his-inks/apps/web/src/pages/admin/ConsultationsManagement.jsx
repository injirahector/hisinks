import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

const STATUS_BADGE = {
  open:            'text-blue-400 bg-blue-400/10 border-blue-400/30',
  agreed:          'text-green-400 bg-green-400/10 border-green-400/30',
  deposit_pending: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  deposit_paid:    'text-brand-accent bg-brand-accent/10 border-brand-accent/30',
  booked:          'text-brand-accent bg-brand-accent/10 border-brand-accent/30',
  closed:          'text-white/30 bg-white/5 border-white/10',
};

function ConsultationsManagement() {
  const [consultations, setConsultations] = useState([]);
  const [total, setTotal]                 = useState(0);
  const [loading, setLoading]             = useState(true);
  const [filter, setFilter]               = useState('');
  const [selected, setSelected]           = useState(null);   // full consultation object
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyText, setReplyText]         = useState('');
  const [sending, setSending]             = useState(false);
  const [priceInput, setPriceInput]       = useState('');
  const [agreeErr, setAgreeErr]           = useState('');
  const [actionMsg, setActionMsg]         = useState('');
  const bottomRef = useRef(null);

  // Load list
  const loadList = async (status = filter) => {
    setLoading(true);
    try {
      const params = status ? `?status=${status}` : '';
      const res = await api.get(`/consultations${params}`);
      setConsultations(res.data.data.consultations);
      setTotal(res.data.pagination.total);
    } catch {
      // silently fail — list stays empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(); }, [filter]);

  // Load detail
  const openDetail = async (id) => {
    setLoadingDetail(true);
    setActionMsg('');
    setAgreeErr('');
    try {
      const res = await api.get(`/consultations/${id}`);
      setSelected(res.data.data.consultation);
      setPriceInput(res.data.data.consultation.agreedPrice ?? '');
    } finally {
      setLoadingDetail(false);
    }
  };

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selected?.messages?.length]);

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const res = await api.post(`/consultations/${selected._id}/messages`, { text: replyText });
      setSelected(res.data.data.consultation);
      setReplyText('');
      loadList();
    } catch (err) {
      setActionMsg(err.message || 'Failed to send.');
    } finally {
      setSending(false);
    }
  };

  const handleAgree = async () => {
    setAgreeErr('');
    const price = Number(priceInput);
    if (isNaN(price) || price < 0) { setAgreeErr('Enter a valid price (0 or more).'); return; }
    try {
      const res = await api.patch(`/consultations/${selected._id}/agree`, { agreedPrice: price });
      setSelected(res.data.data.consultation);
      setActionMsg(`Marked as agreed at KES ${price.toLocaleString()}. Customer can now book.`);
      loadList();
    } catch (err) {
      setAgreeErr(err.message || 'Failed to mark as agreed.');
    }
  };

  const handleClose = async () => {
    if (!window.confirm('Close this consultation? The customer will not be able to book.')) return;
    try {
      const res = await api.patch(`/consultations/${selected._id}/close`);
      setSelected(res.data.data.consultation);
      setActionMsg('Consultation closed.');
      loadList();
    } catch (err) {
      setActionMsg(err.message || 'Failed to close.');
    }
  };

  const handleConfirmDeposit = async () => {
    if (!window.confirm(`Confirm deposit of KES ${selected.depositAmount?.toLocaleString()} received? (Ref: ${selected.depositRef})\nThis will unlock booking for the customer.`)) return;
    try {
      const res = await api.patch(`/consultations/${selected._id}/deposit/confirm`);
      setSelected(res.data.data.consultation);
      setActionMsg('Deposit confirmed. Customer can now book.');
      loadList();
    } catch (err) {
      setActionMsg(err.message || 'Failed to confirm deposit.');
    }
  };

  const handleRejectDeposit = async () => {
    if (!window.confirm('Reject this deposit reference? The customer will be asked to resubmit.')) return;
    try {
      const res = await api.patch(`/consultations/${selected._id}/deposit/reject`);
      setSelected(res.data.data.consultation);
      setActionMsg('Deposit rejected. Customer can resubmit their reference.');
      loadList();
    } catch (err) {
      setActionMsg(err.message || 'Failed to reject deposit.');
    }
  };

  const formatTime = (ts) => new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  const canAct = selected && selected.status !== 'booked' && selected.status !== 'closed';

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Left: list panel ── */}
      <div className="w-80 flex-shrink-0 border-r border-white/8 flex flex-col">
        {/* Header */}
        <div className="px-5 py-5 border-b border-white/8">
          <h2 className="text-white font-medium tracking-wide mb-3">Consultations</h2>
          <p className="text-white/30 text-xs mb-3">{total} total</p>
          <select
            value={filter}
            onChange={e => { setFilter(e.target.value); setSelected(null); }}
            className="w-full bg-white/5 border border-white/10 text-white/60 text-xs px-3 py-2
                       focus:outline-none focus:border-brand-accent"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="agreed">Agreed</option>
            <option value="deposit_pending">Deposit Pending</option>
            <option value="deposit_paid">Deposit Paid</option>
            <option value="booked">Booked</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-white/30 text-xs px-5 py-4">Loading…</p>
          )}
          {!loading && consultations.length === 0 && (
            <p className="text-white/25 text-xs px-5 py-4">No consultations found.</p>
          )}
          {consultations.map(c => {
            const last = c.messages?.[c.messages.length - 1];
            return (
              <button
                key={c._id}
                onClick={() => openDetail(c._id)}
                className={`w-full text-left px-5 py-4 border-b border-white/5 transition-colors
                  ${selected?._id === c._id ? 'bg-brand-accent/10 border-l-2 border-l-brand-accent' : 'hover:bg-white/3'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-white text-sm font-medium truncate">
                    {c.customerName}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 border uppercase tracking-wider flex-shrink-0 ml-2 ${STATUS_BADGE[c.status]}`}>
                    {c.status}
                  </span>
                </div>
                <p className="text-white/30 text-xs truncate">
                  {last ? (last.sender === 'admin' ? 'You: ' : '') + last.text : 'No messages yet'}
                </p>
                <p className="text-white/20 text-[10px] mt-1">{formatTime(c.updatedAt)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Right: detail panel ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {!selected && !loadingDetail && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/20 text-sm">Select a consultation to view the thread</p>
          </div>
        )}

        {loadingDetail && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/30 text-sm">Loading…</p>
          </div>
        )}

        {selected && !loadingDetail && (
          <>
            {/* Detail header */}
            <div className="px-6 py-5 border-b border-white/8 flex items-start justify-between">
              <div>
                <h3 className="text-white font-medium text-lg">{selected.customerName}</h3>
                <p className="text-white/40 text-xs mt-0.5">
                  {selected.userId?.email} &middot; {selected.phone}
                </p>
                {selected.agreedPrice != null && (
                  <p className="text-green-400 text-xs mt-1">
                    Agreed price: KES {selected.agreedPrice.toLocaleString()}
                    {selected.depositAmount != null && (
                      <span className="text-white/30"> &middot; Deposit: KES {selected.depositAmount.toLocaleString()}</span>
                    )}
                  </p>
                )}
                {selected.depositRef && (
                  <p className="text-yellow-400 text-xs mt-1">
                    M-Pesa ref:{' '}
                    <span className="font-mono text-white">{selected.depositRef}</span>
                    {selected.depositConfirmedAt && (
                      <span className="text-white/30 ml-2">confirmed {formatTime(selected.depositConfirmedAt)}</span>
                    )}
                  </p>
                )}
              </div>
              <span className={`text-xs px-3 py-1 border uppercase tracking-wider ${STATUS_BADGE[selected.status]}`}>
                {selected.status}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {selected.messages.length === 0 && (
                <p className="text-white/25 text-sm text-center py-8">No messages yet.</p>
              )}
              {selected.messages.map(msg => {
                const isAdmin = msg.sender === 'admin';
                return (
                  <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] uppercase tracking-wider ${isAdmin ? 'text-brand-accent/60' : 'text-white/30'}`}>
                        {isAdmin ? 'You (Admin)' : selected.customerName}
                      </span>
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                        isAdmin
                          ? 'bg-brand-accent/15 border border-brand-accent/20 text-white'
                          : 'bg-white/5 border border-white/10 text-white/80'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[10px] text-white/20">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Action bar */}
            {canAct && (
              <div className="border-t border-white/8 px-6 py-4 space-y-3">
                {/* Reply */}
                <form onSubmit={handleReply} className="flex gap-3">
                  <textarea
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply(e); } }}
                    placeholder="Reply to customer…"
                    rows={2}
                    className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                               placeholder-white/20 focus:outline-none focus:border-brand-accent resize-none"
                  />
                  <button
                    type="submit"
                    disabled={sending || !replyText.trim()}
                    className="btn-primary px-5 py-2 text-xs self-end disabled:opacity-40 flex-shrink-0"
                  >
                    {sending ? 'Sending…' : 'Reply'}
                  </button>
                </form>

                {/* Agree on price */}
                {selected.status === 'open' && (
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-white/40 text-xs tracking-widest uppercase block mb-1">
                        Agreed Price (KES)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={priceInput}
                        onChange={e => { setPriceInput(e.target.value); setAgreeErr(''); }}
                        placeholder="e.g. 15000"
                        className="w-full bg-white/5 border border-white/10 px-4 py-2 text-white text-sm
                                   focus:outline-none focus:border-green-500 placeholder-white/20"
                      />
                      {agreeErr && <p className="text-red-400 text-xs mt-1">{agreeErr}</p>}
                    </div>
                    <button
                      onClick={handleAgree}
                      className="flex-shrink-0 self-end px-5 py-2 text-xs border border-green-500/50
                                 text-green-400 hover:bg-green-500/10 transition-colors"
                    >
                      Mark as Agreed
                    </button>
                    <button
                      onClick={handleClose}
                      className="flex-shrink-0 self-end px-5 py-2 text-xs border border-white/10
                                 text-white/40 hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}

                {selected.status === 'agreed' && (
                  <div className="flex items-center justify-between">
                    <p className="text-green-400 text-xs">
                      Price agreed at KES {selected.agreedPrice?.toLocaleString()}. Waiting for customer to pay deposit.
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-4 py-1.5 text-xs border border-white/10 text-white/40
                                 hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}

                {/* ── Deposit pending: confirm or reject ── */}
                {selected.status === 'deposit_pending' && (
                  <div className="border border-yellow-500/30 bg-yellow-500/5 px-4 py-3">
                    <p className="text-yellow-400 text-xs font-medium mb-2">
                      Deposit reference submitted — verify and confirm
                    </p>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-white/40 text-xs">M-Pesa Ref:</p>
                        <p className="text-white font-mono text-sm">{selected.depositRef}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white/40 text-xs">Amount</p>
                        <p className="text-white text-sm">KES {selected.depositAmount?.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleConfirmDeposit}
                        className="flex-1 py-2 text-xs border border-green-500/50 text-green-400
                                   hover:bg-green-500/10 transition-colors"
                      >
                        ✓ Confirm Received
                      </button>
                      <button
                        onClick={handleRejectDeposit}
                        className="flex-1 py-2 text-xs border border-red-500/30 text-red-400
                                   hover:bg-red-500/10 transition-colors"
                      >
                        ✗ Reject / Wrong Ref
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Deposit paid: waiting for customer to book ── */}
                {selected.status === 'deposit_paid' && (
                  <div className="flex items-center justify-between">
                    <p className="text-brand-accent text-xs">
                      Deposit confirmed — waiting for customer to book.
                    </p>
                    <button
                      onClick={handleClose}
                      className="px-4 py-1.5 text-xs border border-white/10 text-white/40
                                 hover:text-red-400 hover:border-red-500/30 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}

                {actionMsg && (
                  <p className="text-brand-accent text-xs">{actionMsg}</p>
                )}
              </div>
            )}

            {!canAct && (
              <div className="border-t border-white/8 px-6 py-3 text-white/25 text-xs text-center">
                {selected.status === 'booked'
                  ? `Consultation complete — appointment booked.${selected.bookingId ? '' : ''}`
                  : 'This consultation is closed.'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ConsultationsManagement;
