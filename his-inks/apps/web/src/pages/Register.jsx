import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initGoogleButton } from '../services/googleAuth';

function Register() {
  const { register, googleLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const from = location.state?.from || '/';
  const tattooRef    = location.state?.tattooRef    || null;
  const inspirationId = location.state?.inspirationId || null;

  // Capture referral code from ?ref= query parameter.
  // Stored in state so it survives form interaction but is never shown
  // as an editable field — the user cannot tamper with it.
  const referralCode = searchParams.get('ref') || '';

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleBtnRef = useRef(null);

  // ── Google Identity Services initialisation ────────────────────────────────
  useEffect(() => {
    const cleanup = initGoogleButton(
      googleBtnRef.current,
      handleGoogleCredential,
      'signup_with',
    );
    return cleanup;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogleCredential({ credential }) {
    setServerError('');
    setGoogleLoading(true);
    try {
      // Pass referralCode from the URL so the backend can apply it if this is a new account
      await googleLogin(credential, referralCode || undefined);
      navigate(from, { state: { tattooRef, inspirationId } });
    } catch (err) {
      setServerError(err.message || 'Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field-level error on change
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setErrors({});
    setLoading(true);
    try {
      // Include the referral code from the URL — backend validates it silently
      await register({ ...form, referralCode: referralCode || undefined });
      navigate(from, { state: { tattooRef, inspirationId } });
    } catch (err) {
      // err may be an object of field errors or a plain string
      if (err && typeof err === 'object' && !err.message) {
        setErrors(err);
      } else {
        setServerError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) =>
    `w-full bg-white/5 border px-4 py-3 text-white placeholder-white/20
     focus:outline-none transition-colors duration-200
     ${errors[field] ? 'border-red-500/60 focus:border-red-500' : 'border-white/10 focus:border-brand-accent'}`;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">
            Join the Studio
          </p>
          <h1 className="font-display text-4xl">Create Account</h1>
        </div>

        {/* Server error banner */}
        {serverError && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {serverError}
          </div>
        )}

        {/* Referral banner — shown only when a ?ref= code is present */}
        {referralCode && (
          <div className="mb-6 px-4 py-3 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-sm flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            You were referred by a friend. You&apos;re joining via referral code&nbsp;
            <span className="font-mono font-semibold">{referralCode.toUpperCase()}</span>.
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* First + Last name row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="firstName"
                className="block text-white/50 text-xs tracking-widest uppercase mb-2"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={form.firstName}
                onChange={update('firstName')}
                placeholder="Jane"
                autoComplete="given-name"
                required
                className={inputClass('firstName')}
              />
              {errors.firstName && (
                <p className="mt-1 text-red-400 text-xs">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label
                htmlFor="lastName"
                className="block text-white/50 text-xs tracking-widest uppercase mb-2"
              >
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={form.lastName}
                onChange={update('lastName')}
                placeholder="Doe"
                autoComplete="family-name"
                required
                className={inputClass('lastName')}
              />
              {errors.lastName && (
                <p className="mt-1 text-red-400 text-xs">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="email"
              className="block text-white/50 text-xs tracking-widest uppercase mb-2"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              autoComplete="email"
              required
              className={inputClass('email')}
            />
            {errors.email && <p className="mt-1 text-red-400 text-xs">{errors.email}</p>}
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="phone"
              className="block text-white/50 text-xs tracking-widest uppercase mb-2"
            >
              Phone Number <span className="text-white/30 normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={update('phone')}
              placeholder="+254 7XX XXX XXX"
              autoComplete="tel"
              className={inputClass('phone')}
            />
            {errors.phone && <p className="mt-1 text-red-400 text-xs">{errors.phone}</p>}
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="password"
              className="block text-white/50 text-xs tracking-widest uppercase mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder="Min 8 chars, include a number"
                autoComplete="new-password"
                required
                className={`${inputClass('password')} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-red-400 text-xs">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* ── Google sign-up ─────────────────────────────────────────────── */}
        {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
          <>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs tracking-widest uppercase">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Referral note — reminds user their referral will still apply via Google */}
            {referralCode && (
              <p className="text-white/30 text-xs text-center mb-3">
                Your referral code <span className="font-mono text-brand-accent/70">{referralCode.toUpperCase()}</span> will
                be applied when you continue with Google.
              </p>
            )}

            {/* Google renders its own button inside this div */}
            <div
              ref={googleBtnRef}
              className="w-full"
              aria-label="Sign up with Google"
            />

            {googleLoading && (
              <p className="text-center text-white/40 text-xs mt-2">Signing up with Google…</p>
            )}
          </>
        )}

        <p className="text-center text-white/40 text-sm mt-8">
          Already have an account?{' '}
          <Link to="/login" state={{ from }} className="text-brand-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
