import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

function ForgotPassword() {
  const [email, setEmail]       = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]        = useState('');
  const [loading, setLoading]    = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      // Always show the success state — never reveal whether the email exists
      setSubmitted(true);
    } catch (err) {
      // Validation errors (422) surface a message; everything else is generic
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-16">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">
            Account Recovery
          </p>
          <h1 className="font-display text-4xl">Forgot your password?</h1>
        </div>

        {submitted ? (
          /* ── Success state ── */
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-6 flex items-center justify-center border border-brand-accent/30 bg-brand-accent/10">
              <svg className="w-8 h-8 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <p className="text-white/70 text-sm leading-relaxed mb-8">
              If an account exists with that email, we&apos;ve sent password reset instructions.
              Check your inbox — the link expires in 15 minutes.
            </p>
            <Link
              to="/login"
              className="text-brand-accent text-sm hover:underline"
            >
              ← Back to Login
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            <p className="text-white/40 text-sm text-center mb-8 leading-relaxed">
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </p>

            {/* Error banner */}
            {error && (
              <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white
                             placeholder-white/20 focus:outline-none focus:border-brand-accent
                             transition-colors duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-white/40 text-sm mt-8">
              <Link to="/login" className="text-brand-accent hover:underline">
                ← Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
