import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/';

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
      await register(form);
      navigate(from);
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
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={update('password')}
              placeholder="Min 8 chars, include a number"
              autoComplete="new-password"
              required
              className={inputClass('password')}
            />
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
