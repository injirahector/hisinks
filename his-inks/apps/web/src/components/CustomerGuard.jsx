import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects customer-only routes that require authentication.
 * - Shows a spinner while the auth session is being rehydrated.
 * - Redirects unauthenticated visitors to /login, preserving the intended
 *   destination so they land back here after logging in.
 * - Renders child routes for any authenticated user (customer or admin).
 */
function CustomerGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // Preserve the attempted URL so login can redirect back after auth
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}

export default CustomerGuard;
