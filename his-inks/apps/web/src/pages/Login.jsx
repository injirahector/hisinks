import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || null;

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedIn = await login({ email: form.email, password: form.password });
      if (from) {
        navigate(from);
      } else {
        navigate(loggedIn.role === 'admin' ? '/admin' : '/');
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
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
            Welcome Back
          </p>
          <h1 className="font-display text-4xl">Sign In</h1>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
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
              value={form.email}
              onChange={update('email')}
              autoComplete="email"
              placeholder="you@example.com"
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/20
                         focus:outline-none focus:border-brand-accent transition-colors duration-200"
            />
          </div>

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
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white placeholder-white/20
                         focus:outline-none focus:border-brand-accent transition-colors duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-8">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-brand-accent hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
