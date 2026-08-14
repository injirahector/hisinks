import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { initGoogleButton } from '../services/googleAuth';

// ── Image preview modal ───────────────────────────────────────────────────────
function ImagePreviewModal({ src, onClose }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const filename = src.split('/').pop().split('?')[0] || 'image';

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <div
        className="relative max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 bg-[#111] border border-white/10 border-b-0">
          <p className="text-white/50 text-xs truncate max-w-xs">{filename}</p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-brand-accent/50
                         text-brand-accent hover:bg-brand-accent/10 transition-colors"
              aria-label="Download image"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Download
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-white/40 hover:text-white transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        <div className="bg-[#0B0B0B] border border-white/10 flex items-center justify-center p-4 max-h-[80vh] overflow-auto">
          <img src={src} alt="Full size preview" className="max-w-full max-h-[72vh] object-contain" />
        </div>
        <p className="text-white/20 text-[10px] text-center py-2">Click outside or press Esc to close</p>
      </div>
    </div>
  );
}

// ── Inline auth panel — shown when a guest tries to submit ───────────────────
// Uses the existing auth context directly. No navigation away from the page.
function InlineAuthPanel({ onSuccess, onCancel }) {
  const { login, register, googleLogin } = useAuth();
  const [mode, setMode]           = useState('choice'); // choice | login | register
  const [form, setForm]           = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [errors, setErrors]       = useState({});
  const [serverErr, setServerErr] = useState('');
  const [loading, setLoading]     = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    if (mode !== 'choice') return;
    const cleanup = initGoogleButton(googleBtnRef.current, handleGoogleCredential, 'continue_with');
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  async function handleGoogleCredential({ credential }) {
    setServerErr('');
    setGoogleLoading(true);
    try {
      await googleLogin(credential);
      onSuccess();
    } catch (err) {
      setServerErr(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setServerErr('');
    setLoading(true);
    try {
      await login({ email: loginForm.email, password: loginForm.password });
      onSuccess();
    } catch (err) {
      setServerErr(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setServerErr('');
    setErrors({});
    setLoading(true);
    try {
      await register(form);
      onSuccess();
    } catch (err) {
      if (err && typeof err === 'object' && !err.message) {
        setErrors(err);
      } else {
        setServerErr(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  const inputCls = (err) =>
    `w-full bg-white/5 border px-4 py-2.5 text-white text-sm placeholder-white/20
     focus:outline-none transition-colors
     ${err ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'}`;

  return (
    <div className="border border-white/10 bg-[#0f0f0f] mt-4">
      <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
        <div>
          <p className="text-brand-accent text-xs tracking-widest uppercase font-medium">
            {mode === 'register' ? 'Create Account' : mode === 'login' ? 'Sign In' : 'One last step'}
          </p>
          <p className="text-white/40 text-xs mt-0.5">
            {mode === 'choice'
              ? 'Sign in or create a free account to send your consultation.'
              : mode === 'login'
              ? 'Sign in to send your consultation.'
              : 'Create a free account to send your consultation.'}
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-white/30 hover:text-white transition-colors p-1 flex-shrink-0"
          aria-label="Cancel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="px-5 py-5">
        {serverErr && (
          <div className="mb-4 px-3 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {serverErr}
          </div>
        )}

        {/* ── Choice screen ── */}
        {mode === 'choice' && (
          <div className="space-y-3">
            {/* Google */}
            {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
              <>
                <div ref={googleBtnRef} className="w-full" aria-label="Continue with Google" />
                {googleLoading && <p className="text-white/40 text-xs text-center">Signing in…</p>}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-white/30 text-xs">or</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => { setMode('login'); setServerErr(''); }}
              className="w-full border border-white/10 px-4 py-2.5 text-white/70 text-sm
                         hover:border-brand-accent/50 hover:text-white transition-colors text-left"
            >
              Sign In with Email
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setServerErr(''); }}
              className="w-full border border-brand-accent/30 px-4 py-2.5 text-brand-accent text-sm
                         hover:bg-brand-accent/5 transition-colors text-left"
            >
              Create a Free Account
            </button>
          </div>
        )}

        {/* ── Login form ── */}
        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3" noValidate>
            <input
              type="email"
              value={loginForm.email}
              onChange={e => setLoginForm(p => ({ ...p, email: e.target.value }))}
              placeholder="Email"
              autoFocus
              required
              className={inputCls(false)}
            />
            <input
              type="password"
              value={loginForm.password}
              onChange={e => setLoginForm(p => ({ ...p, password: e.target.value }))}
              placeholder="Password"
              required
              className={inputCls(false)}
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-xs py-2.5 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <p className="text-white/30 text-xs text-center">
              <button type="button" onClick={() => { setMode('choice'); setServerErr(''); }}
                className="hover:text-white/60 transition-colors">← Back</button>
              {' · '}
              <Link to="/forgot-password" className="hover:text-brand-accent transition-colors">
                Forgot password?
              </Link>
            </p>
          </form>
        )}

        {/* ── Register form ── */}
        {mode === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => { setForm(p => ({ ...p, firstName: e.target.value })); setErrors(p => ({ ...p, firstName: '' })); }}
                  placeholder="First name"
                  autoFocus
                  required
                  className={inputCls(errors.firstName)}
                />
                {errors.firstName && <p className="text-red-400 text-[10px] mt-0.5">{errors.firstName}</p>}
              </div>
              <div>
                <input
                  type="text"
                  value={form.lastName}
                  onChange={e => { setForm(p => ({ ...p, lastName: e.target.value })); setErrors(p => ({ ...p, lastName: '' })); }}
                  placeholder="Last name"
                  required
                  className={inputCls(errors.lastName)}
                />
                {errors.lastName && <p className="text-red-400 text-[10px] mt-0.5">{errors.lastName}</p>}
              </div>
            </div>
            <div>
              <input
                type="email"
                value={form.email}
                onChange={e => { setForm(p => ({ ...p, email: e.target.value })); setErrors(p => ({ ...p, email: '' })); }}
                placeholder="Email"
                required
                className={inputCls(errors.email)}
              />
              {errors.email && <p className="text-red-400 text-[10px] mt-0.5">{errors.email}</p>}
            </div>
            <div>
              <input
                type="tel"
                value={form.phone}
                onChange={e => { setForm(p => ({ ...p, phone: e.target.value })); setErrors(p => ({ ...p, phone: '' })); }}
                placeholder="Phone (+254…)"
                required
                className={inputCls(errors.phone)}
              />
              {errors.phone && <p className="text-red-400 text-[10px] mt-0.5">{errors.phone}</p>}
            </div>
            <div>
              <input
                type="password"
                value={form.password}
                onChange={e => { setForm(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                placeholder="Password"
                required
                className={inputCls(errors.password)}
              />
              {errors.password && <p className="text-red-400 text-[10px] mt-0.5">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center text-xs py-2.5 disabled:opacity-50"
            >
              {loading ? 'Creating account…' : 'Create Account & Send'}
            </button>
            <p className="text-white/30 text-xs text-center">
              <button type="button" onClick={() => { setMode('choice'); setServerErr(''); }}
                className="hover:text-white/60 transition-colors">← Back</button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
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
  const location  = useLocation();
  const navigate  = useNavigate();
  const bottomRef = useRef(null);

  // tattooRef passed from Portfolio via router state
  // inspirationId passed from Inspiration Gallery via router state (only the ID)
  const routeTattooRef     = location.state?.tattooRef     || null;
  const routeInspirationId = location.state?.inspirationId || null;

  // null  = no consultation yet (or user cleared it to start a new one)
  // false = still loading
  const [consultation, setConsultation] = useState(false);
  const [loadErr, setLoadErr]           = useState('');

  // Inspiration data fetched from database if passed via route
  const [routeInspirationData, setRouteInspirationData] = useState(null);
  const [inspirationLoadErr, setInspirationLoadErr]     = useState('');

  const [text, setText]       = useState('');
  const [sending, setSending] = useState(false);
  const [sendErr, setSendErr] = useState('');

  // Image attachment state
  const consultFileRef                        = useRef(null);
  const [attachFile, setAttachFile]           = useState(null);
  const [attachPreview, setAttachPreview]     = useState('');
  const [attachErr, setAttachErr]             = useState('');
  const [uploading, setUploading]             = useState(false);
  const [previewSrc, setPreviewSrc]           = useState('');

  // Guest flow — pending submission saved while auth panel is shown
  // { text: string, attachFile: File|null, attachPreview: string }
  const [pendingSubmit, setPendingSubmit]     = useState(null);
  const [showAuthPanel, setShowAuthPanel]     = useState(false);

  // Deposit state
  const [mpesaRef, setMpesaRef]               = useState('');
  const [depositErr, setDepositErr]           = useState('');
  const [depositSending, setDepositSending]   = useState(false);
  const [depositMsg, setDepositMsg]           = useState('');

  // ── Load existing consultation when user is present ───────────────────────
  useEffect(() => {
    if (!user) {
      // Guest — show the empty start screen immediately (no redirect)
      if (!authLoading) setConsultation(null);
      return;
    }
    api.get('/consultations/my')
      .then(res => {
        const c = res.data.data.consultation;
        // If arriving from Portfolio/Gallery always start fresh
        if (routeTattooRef || routeInspirationId) {
          setConsultation(null);
        } else {
          setConsultation(c);
        }
      })
      .catch(() => { setLoadErr('Could not load your consultation. Please try again.'); setConsultation(null); });
  }, [user, authLoading]);

  // ── After auth succeeds, auto-fire the pending submission ─────────────────
  // This runs when `user` changes from null → logged-in (after inline auth).
  useEffect(() => {
    if (!user || !pendingSubmit) return;

    // Close the auth panel and restore the form fields
    setShowAuthPanel(false);
    setText(pendingSubmit.text);
    if (pendingSubmit.attachFile) {
      setAttachFile(pendingSubmit.attachFile);
      setAttachPreview(pendingSubmit.attachPreview);
    }

    // Auto-submit after a tick so state has settled
    const timer = setTimeout(() => {
      doSend(pendingSubmit.text, pendingSubmit.attachFile);
      setPendingSubmit(null);
    }, 100);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Fetch inspiration data if inspirationId provided ─────────────────────
  useEffect(() => {
    if (!routeInspirationId) return;
    api.get(`/inspirations/${routeInspirationId}`)
      .then(res => setRouteInspirationData(res.data.data.inspiration))
      .catch(() => setInspirationLoadErr('Could not load the inspiration. It may have been deleted.'));
  }, [routeInspirationId]);

  // ── Auto-scroll to bottom only when a NEW message arrives ────────────────
  // consultation starts as `false` (loading) then resolves to an object or null.
  // We must not start counting until the consultation is actually loaded,
  // otherwise the transition false→object looks like "new messages arrived"
  // and triggers a scroll on every page open/reload.
  const prevMsgCountRef = useRef(null);
  useEffect(() => {
    // Still loading — do not set the baseline yet
    if (consultation === false) return;

    const count = consultation?.messages?.length ?? 0;
    if (prevMsgCountRef.current !== null && count > prevMsgCountRef.current) {
      // A genuinely new message was added after load — scroll into view
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMsgCountRef.current = count;
  }, [consultation, consultation?.messages?.length]);

  const handleAttachChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachErr('');
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) { setAttachErr('Only JPG, PNG, or WebP images are allowed.'); return; }
    if (file.size > 5 * 1024 * 1024) { setAttachErr('Image must be under 5 MB.'); return; }
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
    const res = await api.post('/uploads/image', data, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data.data.url;
  };

  // ── Core send logic (separated so it can be called post-auth) ─────────────
  const doSend = async (msgText, file) => {
    if (!msgText.trim() && !file) return;
    setSending(true);
    setSendErr('');
    try {
      let imageUrl = '';
      if (file) {
        setUploading(true);
        imageUrl = await uploadAttach(file);
        setUploading(false);
      }

      const isNewThread = !consultation ||
        consultation === null ||
        (consultation.messages?.length === 0 && !consultation.tattooRef?.image && !consultation.inspirationRef?._id);
      const payload = { text: imageUrl ? `${msgText}\n${imageUrl}`.trim() : msgText };
      if (isNewThread && routeTattooRef)     payload.tattooRef     = routeTattooRef;
      if (isNewThread && routeInspirationId) payload.inspirationId = routeInspirationId;

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

  // ── Form submit handler ───────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !attachFile) return;

    // Guest — save what they typed and show the inline auth panel
    if (!user) {
      setPendingSubmit({ text, attachFile, attachPreview });
      setShowAuthPanel(true);
      return;
    }

    await doSend(text, attachFile);
  };

  // Called by InlineAuthPanel once auth succeeds
  // The useEffect above will pick up the user change and fire the pending send
  const handleAuthSuccess = () => {
    // Nothing to do here — the useEffect on [user] handles it
  };

  const handleCancelAuth = () => {
    setShowAuthPanel(false);
    setPendingSubmit(null);
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    const ref = mpesaRef.trim();
    if (!ref) { setDepositErr('Please enter your M-Pesa reference code.'); return; }
    if (!/^[A-Z0-9]{6,20}$/i.test(ref)) { setDepositErr('Invalid reference format. Example: SLK1234XYZ'); return; }
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

  const handleStartNew = () => {
    // Wipe the router state so any inspiration/tattooRef that was passed via
    // navigation (Portfolio → here, Gallery → here) is no longer active.
    // replace:true keeps the back-button stack clean.
    navigate(location.pathname, { replace: true, state: {} });
    setConsultation(null);
    setText('');
    setSendErr('');
    setMpesaRef('');
    setDepositMsg('');
    clearAttach();
  };

  const formatTime = (ts) => {
    const d = new Date(ts);
    return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  // ── Loading ───────────────────────────────────────────────────────────────────
  if (authLoading || consultation === false) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="text-white/30 text-sm">Loading…</div>
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

          {/* Inspiration reference card — shown when arriving from Inspiration Gallery */}
          {routeInspirationData && (
            <div className="mb-6 border border-brand-accent/30 bg-brand-accent/5 flex gap-4 p-4">
              <img
                src={routeInspirationData.image}
                alt={routeInspirationData.title}
                className="w-20 h-20 object-cover flex-shrink-0 border border-brand-accent/20"
              />
              <div className="min-w-0">
                <p className="text-brand-accent text-xs tracking-widest uppercase mb-1">🎨 Selected Inspiration</p>
                <p className="text-white font-medium text-sm truncate">{routeInspirationData.title}</p>
                {routeInspirationData.category && (
                  <p className="text-white/40 text-xs">{routeInspirationData.category}</p>
                )}
                {routeInspirationData.estimatedSize && (
                  <p className="text-white/30 text-xs">Suggested Size: {routeInspirationData.estimatedSize}</p>
                )}
                {routeInspirationData.suggestedPlacement && (
                  <p className="text-white/30 text-xs">Suggested Placement: {routeInspirationData.suggestedPlacement}</p>
                )}
                <p className="text-white/25 text-xs mt-2">
                  This inspiration has been attached to your consultation.
                </p>
              </div>
            </div>
          )}
          {inspirationLoadErr && (
            <div className="mb-6 border border-red-500/30 bg-red-500/5 p-4">
              <p className="text-red-400 text-xs">{inspirationLoadErr}</p>
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
                {uploading ? 'Uploading…' : sending ? 'Sending…' : user ? 'Send' : 'Start Consultation'}
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

          {/* Inline auth panel — shown when a guest tries to submit */}
          {showAuthPanel && (
            <InlineAuthPanel
              onSuccess={handleAuthSuccess}
              onCancel={handleCancelAuth}
            />
          )}

          {/* Pending indicator — shown while auto-sending after auth */}
          {pendingSubmit && !showAuthPanel && sending && (
            <p className="mt-3 text-brand-accent text-xs text-center">
              Sending your consultation…
            </p>
          )}

          {sendErr && <p className="mt-3 text-red-400 text-xs">{sendErr}</p>}

          {!user && !showAuthPanel && (
            <p className="mt-4 text-white/20 text-xs text-center">
              You&apos;ll be asked to sign in or create a free account when you send.
            </p>
          )}

          <p className="mt-3 text-white/20 text-xs text-center">
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
    <>
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

        {/* Tattoo reference card — shown if consultation originated from portfolio.
            Hidden for closed consultations: the reference belongs to the working
            context of that consultation, not to a read-only historical record. */}
        {consultation.tattooRef?.image && status !== 'closed' && status !== 'booked' && (
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

        {/* Inspiration reference card — shown if consultation originated from inspiration gallery.
            Hidden for closed consultations: the reference belongs to the working
            context of that consultation, not to a read-only historical record. */}
        {consultation.inspirationRef?.image && status !== 'closed' && status !== 'booked' && (
          <div className="mb-6 border border-brand-accent/30 bg-brand-accent/5 flex gap-4 p-4">
            <img
              src={consultation.inspirationRef.image}
              alt={consultation.inspirationRef.title}
              className="w-16 h-16 object-cover flex-shrink-0 border border-brand-accent/20"
            />
            <div className="min-w-0">
              <p className="text-brand-accent text-xs tracking-widest uppercase mb-1">🎨 Inspiration Reference</p>
              <p className="text-white text-sm font-medium truncate">{consultation.inspirationRef.title}</p>
              {consultation.inspirationRef.category && (
                <p className="text-white/40 text-xs">{consultation.inspirationRef.category}</p>
              )}
              {consultation.inspirationRef.estimatedSize && (
                <p className="text-white/30 text-xs">Size: {consultation.inspirationRef.estimatedSize}</p>
              )}
              {consultation.inspirationRef.suggestedPlacement && (
                <p className="text-white/30 text-xs">Placement: {consultation.inspirationRef.suggestedPlacement}</p>
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
              
              // Check if this is an inspiration reference message
              const isInspirationRef = msg.text.startsWith('🎨 Selected Inspiration:') || msg.text.startsWith('🎨 Inspiration Reference:');
              
              if (isInspirationRef && consultation.inspirationRef?.image) {
                // Render inspiration reference as a professional card
                return (
                  <div key={msg._id} className="flex justify-start">
                    <div className="w-full max-w-[85%]">
                      <span className="text-[10px] tracking-wider uppercase text-white/30">
                        {consultation.customerName}
                      </span>
                      <div className="mt-1 border border-brand-accent/30 bg-brand-accent/5 rounded-lg overflow-hidden">
                        {/* Inspiration image */}
                        <div className="relative bg-black/40 aspect-video overflow-hidden group cursor-pointer">
                          <img
                            src={consultation.inspirationRef.image}
                            alt={consultation.inspirationRef.title}
                            className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                            onClick={() => setPreviewSrc(consultation.inspirationRef.image)}
                          />
                          <button
                            type="button"
                            onClick={() => setPreviewSrc(consultation.inspirationRef.image)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Preview inspiration image"
                          >
                            <span className="text-white text-[10px] px-2 py-1 bg-black/60 border border-white/20">
                              Preview / Download
                            </span>
                          </button>
                        </div>
                        
                        {/* Inspiration details */}
                        <div className="p-4 space-y-2">
                          <div>
                            <p className="text-brand-accent text-xs tracking-widest uppercase font-medium mb-1">
                              🎨 Selected Inspiration
                            </p>
                            <p className="text-white font-medium">{consultation.inspirationRef.title}</p>
                          </div>
                          
                          {consultation.inspirationRef.category && (
                            <p className="text-white/60 text-xs">
                              <span className="text-white/40">Style: </span>
                              {consultation.inspirationRef.category}
                            </p>
                          )}
                          
                          {consultation.inspirationRef.description && (
                            <p className="text-white/60 text-xs">
                              <span className="text-white/40">Description: </span>
                              {consultation.inspirationRef.description}
                            </p>
                          )}
                          
                          <div className="flex gap-4 text-xs text-white/60 pt-1">
                            {consultation.inspirationRef.estimatedSize && (
                              <div>
                                <span className="text-white/40">Size: </span>
                                {consultation.inspirationRef.estimatedSize}
                              </div>
                            )}
                            {consultation.inspirationRef.suggestedPlacement && (
                              <div>
                                <span className="text-white/40">Placement: </span>
                                {consultation.inspirationRef.suggestedPlacement}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] text-white/20 block mt-1">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              }
              
              // Regular message rendering
              const renderText = (text) =>
                text.split('\n').map((line, i) => {
                  const trimmed = line.trim();
                  const isUrl = /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(trimmed) ||
                                /^https?:\/\/res\.cloudinary\.com\/.+\/image\//i.test(trimmed);
                  if (isUrl) {
                    return (
                      <div key={i} className="mt-2 group relative inline-block">
                        <button
                          type="button"
                          onClick={() => setPreviewSrc(trimmed)}
                          className="block border border-white/10 hover:border-brand-accent/50
                                     transition-colors focus:outline-none focus-visible:ring-2
                                     focus-visible:ring-brand-accent"
                          aria-label="Preview attached image"
                        >
                          <img
                            src={trimmed}
                            alt="Attachment"
                            className="max-w-[200px] max-h-[200px] object-cover group-hover:opacity-80 transition-opacity"
                          />
                          <span className="absolute inset-0 flex items-center justify-center
                                           opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
                            <span className="text-white text-[10px] px-2 py-1 bg-black/60 border border-white/20">
                              Preview / Download
                            </span>
                          </span>
                        </button>
                      </div>
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
            <div className="border-t border-white/8 px-5 py-3 text-xs text-center">
              {status === 'deposit_paid'
                ? <span className="text-white/25">Deposit confirmed — use the button above to book.</span>
                : status === 'closed'
                ? <span className="text-white/60">This consultation is closed. Use the button above to start a new one.</span>
                : <span className="text-white/25">Use the button above to start a new consultation.</span>}
            </div>
          )}
        </div>

        {sendErr && <p className="mt-3 text-red-400 text-xs">{sendErr}</p>}

        <p className="mt-6 text-white/20 text-xs text-center">
          Messages are visible to the studio admin only. Replies may take up to 24 hours.
        </p>
      </div>
    </div>

    {/* Image preview modal */}
    {previewSrc && (
      <ImagePreviewModal src={previewSrc} onClose={() => setPreviewSrc('')} />
    )}
    </>
  );
}

export default MyConsultation;
