import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Protects all /admin/* routes.
 * - Shows nothing while auth is loading (avoids flash).
 * - Redirects unauthenticated users to /login.
 * - Redirects authenticated non-admin users to /.
 * - Renders child routes for admin users.
 */
function AdminGuard() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;

  return <Outlet />;
}

export default AdminGuard;
