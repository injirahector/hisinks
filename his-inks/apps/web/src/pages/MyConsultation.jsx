import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
const STATUS_LABEL = {
  open:            { text: 'Open',            color: 'text-blue-400',     bg: 'bg-blue-400/10 border-blue-400/30' },
  agreed:          { text: 'Agreed',          color: 'text-green-400',    bg: 'bg-green-400/10 border-green-400/30' },
  deposit_pending: { text: 'Deposit Pending', color: 'text-yellow-400',   bg: 'bg-yellow-400/10 border-yellow-400/30' },
  deposit_paid:    { text: 'Deposit Paid',    color: 'text-brand-accent', bg: 'bg-brand-accent/10 border-brand-accent/30' },
  booked:          { text: 'Booked',          color: 'text-brand-accent', bg: 'bg-brand-accent/10 border-brand-accent/30' },
  closed:          { text: 'Closed',          color: 'text-white/30',     bg: 'bg-white/5 border-white/10' },
};

function MyConsultation() {
  const { user, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const bottomRef = useRef(null);

  // tattooRef passed from Portfolio via router state
  const routeTattooRef = location.state?.tattooRef || null;

  // null  = no consultation yet (or user cleared it to start a new one)
  // false = still loading
  const [consultation, setConsultation] = useState(false);
  const [loadErr, setLoadErr]           = useState('');

  const [text, setText]     = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  // Image attachment state
  const consultFileRef                  = useRef(null);
  const [attachFile, setAttachFile]     = useState(null);
  const [attachPreview, setAttachPreview] = useState('');
  const [attachErr, setAttachErr]       = useState('');
  const [uploading, setUploading]       = useState(false);

  const handleAttachChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachErr('');
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setAttachErr('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAttachErr('Image must be under 5 MB.');
      return;
    }
    setAttachFile(file);
    setAttachPreview(URL.createObjectURL(file));
  };

  const clearAttach = () => {
    setAttachFile(null);
    setAttachPreview('');
    setAttachErr('');
    if (consultFileRef.current) consultFileRef.current.value = '';
  };

  const uploadAttach = async (file) => {
    const data = new FormData();
    data.append('image', file);
    const res = await api.post('/uploads/image', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  // Deposit state
  const [mpesaRef, setMpesaRef]             = useState('');
  const [depositErr, setDepositErr]         = useState('');
  const [depositSending, setDepositSending] = useState(false);
  const [depositMsg, setDepositMsg]         = useState('');

  // Redirect if not logged in — preserve tattooRef in the login state so it
  // survives the login redirect and comes back to /my-consultation
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login', {
        state: {
          from: '/my-consultation',
          tattooRef: routeTattooRef,
        },
      });
    }
  }, [user, authLoading, navigate]);

  // Load existing consultation (find-only — never creates)
  useEffect(() => {
    if (!user) return;
    api.get('/consultations/my')
      .then(res => {
        const c = res.data.data.consultation;
        // If arriving from Portfolio with a tattooRef, always auto-start a new
        // consultation — regardless of the current consultation's status
        if (routeTattooRef) {
          setConsultation(null);
        } else {
          setConsultation(c);
        }
      })
      .catch(() => { setLoadErr('Could not load your consultation. Please try again.'); setConsultation(null); });
  }, [user]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [consultation?.messages?.length]);

  // Send message — creates the consultation on the very first send
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !attachFile) return;
    setSending(true);
    setSendErr('');
    try {
      // Upload image attachment if present
      let imageUrl = '';
      if (attachFile) {
        setUploading(true);
        imageUrl = await uploadAttach(attachFile);
        setUploading(false);
      }

      const isNewThread = !consultation ||
        consultation === null ||
        (consultation.messages?.length === 0 && !consultation.tattooRef?.image);
      const payload = { text: imageUrl ? `${text}\n${imageUrl}`.trim() : text };
      if (isNewThread && routeTattooRef) {
        payload.tattooRef = routeTattooRef;
      }
      const res = await api.post('/consultations/my/messages', payload);
      setConsultation(res.data.data.consultation);
      setText('');
      clearAttach();
    } catch (err) {
      setUploading(false);
      setSendErr(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const ref = mpesaRef.trim();
    if (!ref) { setDepositErr('Please enter your M-Pesa reference code.'); return; }
    if (!/^[A-Z0-9]{6,20}$/i.test(ref)) {
      setDepositErr('Invalid reference format. Example: SLK1234XYZ');
      return;
    }
    setDepositErr('');
    setDepositSending(true);
    try {
      const res = await api.post('/consultations/my/deposit', { mpesaRef: ref });
      setConsultation(res.data.data.consultation);
      setDepositMsg("Reference submitted! We'll confirm your payment shortly.");
      setMpesaRef('');
    } catch (err) {
      setDepositErr(err.message || 'Failed to submit reference. Please try again.');
    } finally {
      setDepositSending(false);
    }
  };

  // "Start new" — just clear local state to show the start prompt.
  // The new consultation is created automatically when they send their first message.
  const handleStartNew = () => {
    setConsultation(null);
    setText('');
    setSendErr('');
    setMpesaRef('');
    setDepositMsg('');
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (authLoading || consultation === false) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading your consultation…</div>
      </div>
    );
  }

  // ── Load error ────────────────────────────────────────────────────────────────
  if (loadErr && consultation === null) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-6">
        <p className="text-red-400 text-sm">{loadErr}</p>
      </div>
    );
  }

  // ── No consultation yet (or user pressed "Start New") ────────────────────────
  if (consultation === null) {
    return (
      <div className="pt-24 pb-16 min-h-screen">
        <div className="max-w-2xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Thread</p>
            <h1 className="font-display text-4xl">Consultation</h1>
            <p className="mt-3 text-white/40 text-sm leading-relaxed">
              Tell us about your tattoo idea — size, placement, style, references.
              We'll discuss the design, agree on a price, and walk you through next steps.
            </p>
          </div>

          {/* Tattoo reference card — shown when arriving from Portfolio */}
          {routeTattooRef?.image && (
            <div className="mb-6 border border-brand-accent/30 bg-brand-accent/5 flex gap-4 p-4">
              <img
                src={routeTattooRef.image}
                alt={routeTattooRef.title}
                className="w-20 h-20 object-cover flex-shrink-0 border border-white/10"
              />
              <div className="min-w-0">
                <p className="text-brand-accent text-xs tracking-widest uppercase mb-1">Your Selected Style</p>
                <p className="text-white font-medium text-sm truncate">{routeTattooRef.title}</p>
                {routeTattooRef.category && (
                  <p className="text-white/40 text-xs">{routeTattooRef.category}</p>
                )}
                {routeTattooRef.description && (
                  <p className="text-white/30 text-xs mt-1 line-clamp-2">{routeTattooRef.description}</p>
                )}
                <p className="text-white/25 text-xs mt-2">
                  This reference will be attached to your consultation automatically.
                </p>
              </div>
            </div>
          )}

          {/* Start prompt — message box */}
          <div className="border border-white/8 bg-white/[0.02]">
            <div className="h-[200px] flex items-center justify-center px-6">
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-brand-accent/10 border border-brand-accent/20
                                flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm">Send your first message to begin.</p>
              </div>
            </div>

            {/* Image preview strip */}
            {attachPreview && (
              <div className="border-t border-white/8 px-4 pt-3 pb-0 flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <img src={attachPreview} alt="Attachment preview"
                    className="w-14 h-14 object-cover border border-white/15" />
                  <button
                    type="button"
                    onClick={clearAttach}
                    aria-label="Remove attached image"
                    className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500
                               text-white flex items-center justify-center text-[10px] leading-none"
                  >✕</button>
                </div>
                <p className="text-white/30 text-xs truncate">{attachFile?.name}</p>
              </div>
            )}
            {attachErr && (
              <p className="px-4 pt-2 text-red-400 text-xs">{attachErr}</p>
            )}

            <form onSubmit={handleSend} className="border-t border-white/8 p-4 flex gap-3">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                placeholder="Describe your tattoo idea… (Enter to send)"
                rows={2}
                autoFocus
                className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                           placeholder-white/20 focus:outline-none focus:border-brand-accent
                           resize-none transition-colors"
              />
              {/* Image attach button */}
              <button
                type="button"
                onClick={() => consultFileRef.current?.click()}
                aria-label="Attach an image"
                className="self-end p-2.5 border border-white/10 text-white/40 hover:text-brand-accent
                           hover:border-brand-accent/40 transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </button>
              <button
                type="submit"
                disabled={sending || uploading || (!text.trim() && !attachFile)}
                className="btn-primary px-5 py-2 text-xs self-end disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {uploading ? 'Uploading…' : sending ? 'Sending…' : 'Send'}
              </button>
            </form>
            <input
              ref={consultFileRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleAttachChange}
              className="hidden"
            />
          </div>

          {sendErr && <p className="mt-3 text-red-400 text-xs">{sendErr}</p>}

          <p className="mt-6 text-white/20 text-xs text-center">
            Messages are visible to the studio admin only. Replies may take up to 24 hours.
          </p>
        </div>
      </div>
    );
  }

  // ── Active consultation ───────────────────────────────────────────────────────
  const status  = consultation.status;
  const badge   = STATUS_LABEL[status] ?? STATUS_LABEL.open;
  const messages       = consultation.messages ?? [];
  const canSend        = status === 'open' || status === 'agreed' || status === 'deposit_pending';
  const isAgreed       = status === 'agreed';
  const isDepositPending = status === 'deposit_pending';
  const isDepositPaid  = status === 'deposit_paid';
  const isBooked       = status === 'booked';
  const depositAmount  = consultation.depositAmount;
  const agreedPrice    = consultation.agreedPrice;

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Thread</p>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-4xl">
              Consultation
              {consultation.consultationNumber > 1 && (
                <span className="text-white/20 text-2xl ml-3">#{consultation.consultationNumber}</span>
              )}
            </h1>
            <span className={`text-xs px-3 py-1 border ${badge.bg} ${badge.color} tracking-wider uppercase`}>
              {badge.text}
            </span>
          </div>
          {consultation.agreedPrice != null && (
            <p className="mt-3 text-white/50 text-sm">
              Agreed price:{' '}
              <span className="text-green-400 font-medium">
                KES {consultation.agreedPrice.toLocaleString()}
              </span>
            </p>
          )}
        </div>

        {/* Tattoo reference card — shown if consultation originated from portfolio */}
        {consultation.tattooRef?.image && (
          <div className="mb-6 border border-white/10 bg-white/[0.02] flex gap-4 p-4">
            <img
              src={consultation.tattooRef.image}
              alt={consultation.tattooRef.title}
              className="w-16 h-16 object-cover flex-shrink-0 border border-white/10"
            />
            <div className="min-w-0">
              <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Style Reference</p>
              <p className="text-white text-sm font-medium truncate">{consultation.tattooRef.title}</p>
              {consultation.tattooRef.category && (
                <p className="text-white/40 text-xs">{consultation.tattooRef.category}</p>
              )}
            </div>
          </div>
        )}

        {/* ── AGREED: deposit payment instructions ── */}
        {isAgreed && (
          <div className="mb-6 border border-green-500/30 bg-green-500/5">
            <div className="px-5 py-4 border-b border-green-500/20">
              <p className="text-green-400 text-sm font-medium mb-1">Price agreed — pay your deposit to unlock booking</p>
              <p className="text-white/40 text-xs">
                A 20% deposit of{' '}
                <span className="text-white font-medium">KES {depositAmount?.toLocaleString()}</span>
                {' '}is required before you can book your appointment.
              </p>
            </div>
            <div className="px-5 py-4 border-b border-green-500/15 bg-white/[0.015]">
              <p className="text-white/50 text-xs tracking-widest uppercase mb-3">How to pay</p>
              <ol className="space-y-1.5 text-sm text-white/60">
                <li><span className="text-white/30 mr-2">1.</span>Go to <strong className="text-white/80">M-Pesa</strong> → Lipa Na M-Pesa → Pay Bill</li>
                <li><span className="text-white/30 mr-2">2.</span>Business No: <strong className="text-white font-mono">625625</strong></li>
                <li><span className="text-white/30 mr-2">3.</span>Account No: <strong className="text-white font-mono">7715761427</strong></li>
                <li><span className="text-white/30 mr-2">4.</span>Amount: <strong className="text-white">KES {depositAmount?.toLocaleString()}</strong></li>
                <li><span className="text-white/30 mr-2">5.</span>Enter your PIN and confirm</li>
                <li><span className="text-white/30 mr-2">6.</span>Account Name: <strong className="text-white font-mono">Hector Surherland Injira</strong></li>
              </ol>
            </div>
            <form onSubmit={handleDepositSubmit} className="px-5 py-4">
              <label className="text-white/40 text-xs tracking-widest uppercase block mb-2">
                M-Pesa Confirmation Code
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={mpesaRef}
                  onChange={e => { setMpesaRef(e.target.value.toUpperCase()); setDepositErr(''); }}
                  placeholder="e.g. SLK1234XYZ"
                  maxLength={20}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                             font-mono placeholder-white/20 focus:outline-none focus:border-green-500
                             uppercase tracking-wider"
                />
                <button
                  type="submit"
                  disabled={depositSending || !mpesaRef.trim()}
                  className="flex-shrink-0 px-5 py-2 text-xs border border-green-500/50
                             text-green-400 hover:bg-green-500/10 transition-colors
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {depositSending ? 'Submitting…' : 'Submit'}
                </button>
              </div>
              {depositErr && <p className="text-red-400 text-xs mt-2">{depositErr}</p>}
              {depositMsg && <p className="text-green-400 text-xs mt-2">{depositMsg}</p>}
              <p className="text-white/20 text-xs mt-3">
                After submitting, our team will verify your payment and unlock your booking (usually within a few hours).
              </p>
            </form>
          </div>
        )}

        {/* ── DEPOSIT PENDING ── */}
        {isDepositPending && (
          <div className="mb-6 px-5 py-4 border border-yellow-500/30 bg-yellow-500/5">
            <p className="text-yellow-400 text-sm font-medium mb-1">Deposit reference submitted — awaiting confirmation</p>
            <p className="text-white/40 text-xs mb-2">
              Reference code:{' '}
              <span className="text-white font-mono font-medium">{consultation.depositRef}</span>
            </p>
            <p className="text-white/30 text-xs">
              We're verifying your M-Pesa payment of{' '}
              <span className="text-white">KES {depositAmount?.toLocaleString()}</span>.
              Once confirmed, your booking link will appear here. This usually takes a few hours.
            </p>
          </div>
        )}

        {/* ── DEPOSIT PAID ── */}
        {isDepositPaid && (
          <div className="mb-6 px-5 py-4 border border-brand-accent/30 bg-brand-accent/8">
            <p className="text-brand-accent text-sm font-medium mb-1">Deposit confirmed — you can now book your appointment!</p>
            <p className="text-white/40 text-xs mb-4">
              Your KES {depositAmount?.toLocaleString()} deposit has been verified.
              Agreed total: KES {agreedPrice?.toLocaleString()}.
            </p>
            <Link
              to="/book"
              state={{ tattooRef: consultation.tattooRef?.image ? consultation.tattooRef : null }}
              className="btn-primary text-xs py-2.5 px-6 inline-flex"
            >
              Book Appointment →
            </Link>
          </div>
        )}

        {/* ── BOOKED ── */}
        {isBooked && (
          <div className="mb-6 border border-brand-accent/30 bg-brand-accent/5">
            <div className="px-5 py-4 border-b border-brand-accent/20">
              <p className="text-brand-accent text-sm font-medium mb-1">Appointment booked!</p>
              <p className="text-white/40 text-xs">Your consultation is complete. See your booking below.</p>
            </div>
            <div className="px-5 py-4 flex items-center gap-4 flex-wrap">
              <Link to="/my-bookings" className="btn-primary text-xs py-2.5 px-6 inline-flex">
                View My Booking
              </Link>
              <button
                onClick={handleStartNew}
                className="text-xs px-6 py-2.5 border border-white/15 text-white/50
                           hover:text-white hover:border-white/30 transition-colors"
              >
                + Start New Consultation
              </button>
            </div>
          </div>
        )}

        {/* ── CLOSED ── */}
        {status === 'closed' && (
          <div className="mb-6 border border-white/10 bg-white/[0.02]">
            <div className="px-5 py-4 border-b border-white/8">
              <p className="text-white/40 text-sm font-medium mb-1">Consultation closed</p>
              <p className="text-white/25 text-xs">This consultation was closed without booking. Start a new one whenever you're ready.</p>
            </div>
            <div className="px-5 py-4">
              <button
                onClick={handleStartNew}
                className="btn-primary text-xs py-2.5 px-6 inline-flex"
              >
                + Start New Consultation
              </button>
            </div>
          </div>
        )}

        {/* Message thread */}
        <div className="border border-white/8 bg-white/[0.02]">
          <div className="h-[420px] overflow-y-auto px-5 py-5 space-y-4 flex flex-col">
            {messages.length === 0 && (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-white/25 text-sm text-center">No messages yet.</p>
              </div>
            )}
            {messages.map((msg) => {
              const isCustomer = msg.sender === 'customer';
              // Split message into lines; render image URLs as <img> tags
              const renderText = (text) =>
                text.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  const isUrl = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(trimmed) ||
                                /^https?:\/\/res\.cloudinary\.com\/.+\/image\//i.test(trimmed);
                  if (isUrl) {
                    return (
                      <img
                        key={i}
                        src={trimmed}
                        alt="Reference"
                        className="mt-2 max-w-[200px] border border-white/10 object-contain"
                      />
                    );
                  }
                  return <p key={i} className={i > 0 ? 'mt-0.5' : ''}>{line}</p>;
                });

              return (
                <div key={msg._id} className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isCustomer ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <span className={`text-[10px] tracking-wider uppercase ${isCustomer ? 'text-white/30' : 'text-brand-accent/60'}`}>
                      {isCustomer ? 'You' : 'His Inks Studio'}
                    </span>
                    <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                      isCustomer
                        ? 'bg-brand-accent/15 border border-brand-accent/20 text-white'
                        : 'bg-white/5 border border-white/10 text-white/80'
                    }`}>
                      {renderText(msg.text)}
                    </div>
                    <span className="text-[10px] text-white/20">{formatTime(msg.createdAt)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {canSend ? (
            <>
              {/* Image attachment preview strip */}
              {attachPreview && (
                <div className="border-t border-white/8 px-4 pt-3 pb-0 flex items-center gap-3">
                  <div className="relative flex-shrink-0">
                    <img src={attachPreview} alt="Attachment preview"
                      className="w-14 h-14 object-cover border border-white/15" />
                    <button
                      type="button"
                      onClick={clearAttach}
                      aria-label="Remove attached image"
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500
                                 text-white flex items-center justify-center text-[10px] leading-none"
                    >✕</button>
                  </div>
                  <p className="text-white/30 text-xs truncate">{attachFile?.name}</p>
                </div>
              )}
              {attachErr && (
                <p className="px-4 pt-2 text-red-400 text-xs">{attachErr}</p>
              )}
              <form onSubmit={handleSend} className="border-t border-white/8 p-4 flex gap-3">
                <textarea
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }}
                  placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                             placeholder-white/20 focus:outline-none focus:border-brand-accent
                             resize-none transition-colors"
                />
                {/* Image attach button */}
                <button
                  type="button"
                  onClick={() => consultFileRef.current?.click()}
                  aria-label="Attach an image"
                  className="self-end p-2.5 border border-white/10 text-white/40 hover:text-brand-accent
                             hover:border-brand-accent/40 transition-colors flex-shrink-0"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                  </svg>
                </button>
                <button
                  type="submit"
                  disabled={sending || uploading || (!text.trim() && !attachFile)}
                  className="btn-primary px-5 py-2 text-xs self-end disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {uploading ? 'Uploading…' : sending ? 'Sending…' : 'Send'}
                </button>
              </form>
              <input
                ref={consultFileRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAttachChange}
                className="hidden"
              />
            </>
          ) : (
            <div className="border-t border-white/8 px-5 py-3 text-white/25 text-xs text-center">
              {status === 'deposit_paid'
                ? 'Deposit confirmed — use the button above to book.'
                : 'Use the button above to start a new consultation.'}
            </div>
          )}
        </div>

        {sendErr && <p className="mt-3 text-red-400 text-xs">{sendErr}</p>}

        <p className="mt-6 text-white/20 text-xs text-center">
          Messages are visible to the studio admin only. Replies may take up to 24 hours.
        </p>
      </div>
    </div>
  );
}

export default MyConsultation;
