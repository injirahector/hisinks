import { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageLightbox from '../components/ImageLightbox';
import CalendarPicker from '../components/CalendarPicker';

const SIZES = ['Small', 'Medium', 'Large', 'Extra Large', 'Half Sleeve', 'Full Sleeve'];

const PLACEMENTS = [
  'Forearm', 'Upper Arm', 'Shoulder', 'Back', 'Chest', 'Ribs',
  'Wrist', 'Hand', 'Neck', 'Leg', 'Ankle', 'Foot', 'Other',
];

const EMPTY = {
  customerName: '',
  phone: '',
  email: '',
  tattooIdea: '',
  description: '',
  placement: '',
  size: '',
  referenceImage: '',
};

const inputClass = (err) =>
  `w-full bg-white/5 border px-4 py-3 text-white placeholder-white/20
   focus:outline-none transition-colors duration-200 text-sm
   ${err ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'}`;

const labelClass = 'block text-white/50 text-xs tracking-widest uppercase mb-2';

// ── Slot picker sub-component ─────────────────────────────────────────────────
function SlotPicker({ selectedDate, onDateChange, selectedSlot, onSlotSelect, error }) {
  const [slotsData, setSlotsData]  = useState(null);
  const [loadingSlots, setLoading] = useState(false);
  const [slotsErr, setSlotsErr]    = useState('');

  const fetchSlots = useCallback(async (date) => {
    if (!date) return;
    setLoading(true);
    setSlotsErr('');
    setSlotsData(null);
    try {
      const res = await api.get(`/availability/slots?date=${date}`);
      setSlotsData(res.data.data);
    } catch {
      setSlotsErr('Could not load available times. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDateSelect = (date) => {
    onDateChange(date);
    onSlotSelect('');
    if (date) fetchSlots(date);
    else setSlotsData(null);
  };

  // Format "09:00" → "9:00 AM" / "14:00" → "2:00 PM"
  const fmt = (hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const suffix = h < 12 ? 'AM' : 'PM';
    const hour   = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  return (
    <div className="space-y-6">
      {/* ── Calendar date picker ── */}
      <div>
        <label className={labelClass}>
          Preferred Date <span className="text-brand-accent">*</span>
        </label>
        <CalendarPicker
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          error={error}
        />
      </div>

      {/* ── Time slots — shown after a date is picked ── */}
      {selectedDate && (
        <div>
          <label className={labelClass}>
            Preferred Time <span className="text-brand-accent">*</span>
          </label>

          {loadingSlots && (
            <div className="flex items-center gap-2 text-white/40 text-sm py-3">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Loading available times…
            </div>
          )}

          {!loadingSlots && slotsErr && (
            <p className="text-red-400 text-sm py-2">{slotsErr}</p>
          )}

          {!loadingSlots && slotsData && !slotsData.isOpen && (
            <div className="border border-white/8 bg-white/3 px-4 py-4 text-white/40 text-sm">
              The studio is closed on this day. Please choose a different date.
            </div>
          )}

          {!loadingSlots && slotsData && slotsData.isOpen && slotsData.fullyBooked && (
            <div className="border border-white/8 bg-white/3 px-4 py-4 text-white/40 text-sm">
              This day is already booked. We only take one customer per day — please choose a different date.
            </div>
          )}

          {!loadingSlots && slotsData && slotsData.isOpen && !slotsData.fullyBooked && slotsData.slots.length === 0 && (
            <div className="border border-white/8 bg-white/3 px-4 py-4 text-white/40 text-sm">
              No available times on this date. Please choose a different date.
            </div>
          )}

          {!loadingSlots && slotsData && slotsData.isOpen && !slotsData.fullyBooked && slotsData.slots.length > 0 && (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slotsData.slots.map((slot) => {
                  const isSelected = selectedSlot === slot.start;
                  return (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => onSlotSelect(slot.start)}
                      className={`
                        px-3 py-2.5 text-xs border transition-colors duration-150 text-center
                        ${isSelected
                          ? 'border-brand-accent bg-brand-accent/15 text-brand-accent'
                          : 'border-white/10 bg-white/3 text-white/60 hover:border-white/30 hover:text-white hover:bg-white/8'
                        }
                      `}
                    >
                      {fmt(slot.start)}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-white/25 text-xs">
                {slotsData.slots.length} time{slotsData.slots.length !== 1 ? 's' : ''} available
              </p>
            </>
          )}

          {error && selectedDate && !selectedSlot && slotsData?.slots?.length > 0 && (
            <p className="mt-1 text-red-400 text-xs">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main BookingPage ──────────────────────────────────────────────────────────
function BookingPage() {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const fileRef     = useRef(null);

  const [form, setForm] = useState(() => ({
    ...EMPTY,
    customerName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
    phone:        user?.phone  || '',
    email:        user?.email  || '',
  }));
  const [selectedDate, setSelectedDate]     = useState('');
  const [selectedSlot, setSelectedSlot]     = useState('');
  const [errors, setErrors]                 = useState({});
  const [loading, setLoading]               = useState(false);
  const [success, setSuccess]               = useState(false);
  const [serverErr, setServerErr]           = useState('');
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Prefill contact fields from the logged-in user whenever user becomes available
  useEffect(() => {
    if (!user) return;
    setForm(prev => ({
      ...prev,
      customerName: prev.customerName || `${user.firstName} ${user.lastName}`.trim(),
      phone:        prev.phone        || user.phone || '',
      email:        prev.email        || user.email || '',
    }));
  }, [user]);

  // Consultation gate — check if user has an agreed consultation
  const [consultationStatus, setConsultationStatus] = useState('checking'); // checking | ok | blocked

  useEffect(() => {
    if (!user) { setConsultationStatus('ok'); return; } // will hit auth prompt on submit
    api.get('/consultations/my')
      .then(res => {
        const status = res.data.data.consultation.status;
        setConsultationStatus(status === 'deposit_paid' ? 'ok' : 'blocked');
      })
      .catch(() => setConsultationStatus('blocked'));
  }, [user]);

  // Image state
  const [imageFile, setImageFile]       = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadErr, setUploadErr]       = useState('');
  const [lightbox, setLightbox]         = useState(false);

  const update = (f) => (e) => {
    setForm((p) => ({ ...p, [f]: e.target.value }));
    if (errors[f]) setErrors((p) => ({ ...p, [f]: '' }));
  };

  // ── File picker ──────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadErr('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Image must be under 5 MB.');
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setForm((p) => ({ ...p, referenceImage: '' }));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setUploadErr('');
    setForm((p) => ({ ...p, referenceImage: '' }));
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Upload helper ────────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    const data = new FormData();
    data.append('image', file);
    const res = await api.post('/uploads/image', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  // ── Client-side validation ───────────────────────────────────────────────────
  const validate = () => {
    const errs = {};
    if (!form.customerName.trim()) errs.customerName = 'Full name is required.';
    if (!form.phone.trim())        errs.phone        = 'Phone number is required.';
    if (!form.tattooIdea.trim())   errs.tattooIdea   = 'Tattoo idea is required.';
    if (!form.description.trim())  errs.description  = 'Description is required.';
    if (!form.placement)           errs.placement    = 'Placement is required.';
    if (!form.size)                errs.size         = 'Size is required.';
    if (!selectedDate)             errs.schedule     = 'Please select a date and time.';
    else if (!selectedSlot)        errs.schedule     = 'Please select a time slot.';
    return errs;
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerErr('');

    if (!user) {
      setShowAuthPrompt(true);
      return;
    }

    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      // Scroll to first error
      const first = document.querySelector('[data-error]');
      first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors({});

    // Build preferredDate: slot time is treated as UTC wall-clock hour.
    // e.g. date "2026-08-10" + slot "09:00" → "2026-08-10T09:00:00.000Z"
    const preferredDate = `${selectedDate}T${selectedSlot}:00.000Z`;

    setLoading(true);
    try {
      let imageUrl = form.referenceImage;
      if (imageFile && !imageUrl) {
        imageUrl = await uploadFile(imageFile);
      }

      await api.post('/bookings', {
        ...form,
        referenceImage: imageUrl,
        preferredDate,
      });

      setSuccess(true);
      setForm({
        ...EMPTY,
        customerName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
        phone:        user?.phone || '',
        email:        user?.email || '',
      });
      setSelectedDate('');
      setSelectedSlot('');
      setImageFile(null);
      setImagePreview('');
    } catch (err) {
      if (err && typeof err === 'object' && !err.message) {
        setErrors(err);
      } else {
        setServerErr(err.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Consultation gate ────────────────────────────────────────────────────────
  if (consultationStatus === 'checking') {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-white/30 text-sm">Checking your consultation status…</p>
      </div>
    );
  }

  if (consultationStatus === 'blocked') {
    return (
      <div className="min-h-screen pt-24 pb-24 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30
                          flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Consultation Required</p>
          <h1 className="font-display text-4xl mb-5">Chat with us first</h1>
          <p className="text-white/40 leading-relaxed mb-10">
            Before booking an appointment, we need to discuss your tattoo idea, agree on a price, and confirm your deposit payment.
            Head to your consultation page to get started.
          </p>
          <Link to="/my-consultation" className="btn-primary text-xs py-2.5 px-6 inline-flex justify-center">
            Go to My Consultation
          </Link>
        </div>
      </div>
    );
  }

  // ── Auth prompt ──────────────────────────────────────────────────────────────
  if (showAuthPrompt) {
    return (
      <div className="min-h-screen pt-24 pb-24 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30
                          flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Account Required</p>
          <h1 className="font-display text-4xl mb-5">Create an account to book</h1>
          <p className="text-white/40 leading-relaxed mb-10">
            You need a free account to submit a booking request. This lets you track
            your appointment status and receive updates from the studio.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setShowAuthPrompt(false)} className="btn-outline text-xs py-2.5 px-6">
              Back to Form
            </button>
            <Link to="/register" state={{ from: '/book' }} className="btn-primary text-xs py-2.5 px-6">
              Create Account
            </Link>
          </div>
          <p className="mt-6 text-white/25 text-xs">
            Already have an account?{' '}
            <Link to="/login" state={{ from: '/book' }} className="text-brand-accent hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-24 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-brand-accent/10 border border-brand-accent/30
                          flex items-center justify-center mx-auto mb-8">
            <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Request Received</p>
          <h1 className="font-display text-4xl mb-5">We&apos;ll be in touch</h1>
          <p className="text-white/40 leading-relaxed mb-10">
            Your booking request has been submitted. We&apos;ll review your idea and
            contact you within 24–48 hours to confirm your appointment.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button onClick={() => setSuccess(false)} className="btn-outline text-xs py-2.5 px-6">
              Submit Another
            </button>
            <Link to="/my-bookings" className="btn-primary text-xs py-2.5 px-6">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="pt-24 pb-24 min-h-screen">
        <div className="max-w-2xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-12">
            <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Get Inked</p>
            <h1 className="font-display text-5xl mb-5">Book an Appointment</h1>
            <p className="text-white/40 leading-relaxed max-w-md mx-auto">
              Tell us about your tattoo vision and pick an available time.
              We&apos;ll reach out to confirm your session.
            </p>
          </div>

          {serverErr && (
            <div className="mb-8 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {serverErr}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-6">

            {/* ── Your Details ── */}
            <div>
              <p className="text-brand-accent text-xs tracking-widest uppercase mb-5 pb-2 border-b border-white/8">
                Your Details
              </p>
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div data-error={errors.customerName || undefined}>
                    <label className={labelClass}>Full Name <span className="text-brand-accent">*</span></label>
                    <input type="text" value={form.customerName} onChange={update('customerName')}
                      placeholder="John Doe" required className={inputClass(errors.customerName)} />
                    {errors.customerName && <p className="mt-1 text-red-400 text-xs">{errors.customerName}</p>}
                  </div>
                  <div data-error={errors.phone || undefined}>
                    <label className={labelClass}>Phone <span className="text-brand-accent">*</span></label>
                    <input type="tel" value={form.phone} onChange={update('phone')}
                      placeholder="+254 7XX XXX XXX" required className={inputClass(errors.phone)} />
                    {errors.phone && <p className="mt-1 text-red-400 text-xs">{errors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label className={labelClass}>
                    Email <span className="text-white/30 normal-case tracking-normal">(optional)</span>
                  </label>
                  <input type="email" value={form.email} onChange={update('email')}
                    placeholder="you@example.com" className={inputClass(errors.email)} />
                  {errors.email && <p className="mt-1 text-red-400 text-xs">{errors.email}</p>}
                </div>
              </div>
            </div>

            {/* ── Tattoo Details ── */}
            <div>
              <p className="text-brand-accent text-xs tracking-widest uppercase mb-5 pb-2 border-b border-white/8">
                Tattoo Details
              </p>
              <div className="space-y-5">
                <div data-error={errors.tattooIdea || undefined}>
                  <label className={labelClass}>Tattoo Idea <span className="text-brand-accent">*</span></label>
                  <input type="text" value={form.tattooIdea} onChange={update('tattooIdea')}
                    placeholder="e.g. Lion tattoo, Lotus mandala, Japanese sleeve…"
                    required className={inputClass(errors.tattooIdea)} />
                  {errors.tattooIdea && <p className="mt-1 text-red-400 text-xs">{errors.tattooIdea}</p>}
                </div>

                <div data-error={errors.description || undefined}>
                  <label className={labelClass}>Description <span className="text-brand-accent">*</span></label>
                  <textarea value={form.description} onChange={update('description')} rows={4}
                    placeholder="Describe the style, mood, elements, colours, and any specific details you have in mind…"
                    required className={inputClass(errors.description) + ' resize-none'} />
                  {errors.description && <p className="mt-1 text-red-400 text-xs">{errors.description}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div data-error={errors.placement || undefined}>
                    <label className={labelClass}>Placement <span className="text-brand-accent">*</span></label>
                    <select value={form.placement} onChange={update('placement')} required
                      className={inputClass(errors.placement) + ' bg-[#0B0B0B]'}>
                      <option value="">Select placement…</option>
                      {PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                    {errors.placement && <p className="mt-1 text-red-400 text-xs">{errors.placement}</p>}
                  </div>
                  <div data-error={errors.size || undefined}>
                    <label className={labelClass}>Size <span className="text-brand-accent">*</span></label>
                    <select value={form.size} onChange={update('size')} required
                      className={inputClass(errors.size) + ' bg-[#0B0B0B]'}>
                      <option value="">Select size…</option>
                      {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {errors.size && <p className="mt-1 text-red-400 text-xs">{errors.size}</p>}
                  </div>
                </div>

                {/* ── Reference Image Upload ── */}
                <div>
                  <label className={labelClass}>
                    Reference Image{' '}
                    <span className="text-white/30 normal-case tracking-normal">(optional · max 5 MB)</span>
                  </label>

                  {!imagePreview ? (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="w-full border border-dashed border-white/15 hover:border-brand-accent/50
                                 bg-white/3 hover:bg-white/5 transition-colors duration-200
                                 flex flex-col items-center justify-center gap-2 py-8 text-center"
                    >
                      <svg className="w-7 h-7 text-white/25" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-white/40 text-sm">Click to upload an image</span>
                      <span className="text-white/20 text-xs">JPG, PNG, WebP</span>
                    </button>
                  ) : (
                    <div className="relative border border-white/10 bg-white/3">
                      <button
                        type="button"
                        onClick={() => setLightbox(true)}
                        className="group relative block w-full"
                        title="Click to view full size"
                      >
                        <img
                          src={imagePreview}
                          alt="Reference preview"
                          className="w-full max-h-64 object-contain group-hover:opacity-80 transition-opacity"
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="bg-black/60 text-white text-xs px-3 py-1 border border-white/20">
                            View full size
                          </span>
                        </div>
                      </button>
                      <div className="flex items-center justify-between px-3 py-2">
                        <p className="text-white/30 text-xs truncate">{imageFile?.name}</p>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="bg-black/70 hover:bg-black text-white/60 hover:text-white
                                       px-3 py-1 text-xs border border-white/10 transition-colors"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="bg-black/70 hover:bg-red-900/60 text-white/60 hover:text-red-400
                                       px-3 py-1 text-xs border border-white/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {uploadErr && <p className="mt-1.5 text-red-400 text-xs">{uploadErr}</p>}
                </div>
              </div>
            </div>

            {/* ── Scheduling ── */}
            <div data-error={errors.schedule || undefined}>
              <p className="text-brand-accent text-xs tracking-widest uppercase mb-5 pb-2 border-b border-white/8">
                Scheduling
              </p>
              <SlotPicker
                selectedDate={selectedDate}
                onDateChange={(d) => {
                  setSelectedDate(d);
                  if (errors.schedule) setErrors((p) => ({ ...p, schedule: '' }));
                }}
                selectedSlot={selectedSlot}
                onSlotSelect={(s) => {
                  setSelectedSlot(s);
                  if (errors.schedule) setErrors((p) => ({ ...p, schedule: '' }));
                }}
                error={errors.schedule}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!uploadErr}
              className="btn-primary w-full justify-center py-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? (imageFile && !form.referenceImage ? 'Uploading image…' : 'Submitting…')
                : 'Submit Booking Request'}
            </button>

            <p className="text-center text-white/25 text-xs leading-relaxed">
              By submitting this form you agree to be contacted regarding your appointment.
              We&apos;ll never share your details with third parties.
            </p>
          </form>
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          src={imagePreview}
          alt={imageFile?.name || 'Reference image'}
          onClose={() => setLightbox(false)}
        />
      )}
    </>
  );
}

export default BookingPage;
