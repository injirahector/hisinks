import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import AppRoutes from './routes/AppRoutes';
import MaintenancePage from './pages/MaintenancePage';

// Read the env flag at module load time.
// Set VITE_MAINTENANCE_MODE=true in Vercel environment variables to enable.
// Set to false (or leave unset) for normal operation.
const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === 'true';

function App() {
  // When maintenance mode is active, render the standalone page immediately.
  // AuthProvider (and its /auth/me API call) is never mounted, so no API
  // traffic hits the backend from public visitors.
  if (MAINTENANCE_MODE) {
    return <MaintenancePage />;
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
