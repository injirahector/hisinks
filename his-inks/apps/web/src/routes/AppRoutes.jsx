import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Portfolio from '../pages/Portfolio';
import BookingPage from '../pages/BookingPage';
import About from '../pages/About';
import Contact from '../pages/Contact';
import MyBookings from '../pages/MyBookings';
import MyConsultation from '../pages/MyConsultation';
import MyReviews from '../pages/MyReviews';
import Notifications from '../pages/Notifications';
import AdminGuard from '../components/AdminGuard';
import AdminLayout from '../pages/admin/AdminLayout';
import AdminDashboard from '../pages/admin/AdminDashboard';
import TattoosManagement from '../pages/admin/TattoosManagement';
import BookingsManagement from '../pages/admin/BookingsManagement';
import ConsultationsManagement from '../pages/admin/ConsultationsManagement';
import ReviewsManagement from '../pages/admin/ReviewsManagement';

function AppRoutes() {
  return (
    <Routes>
      {/* ── Public / customer routes ── */}
      <Route element={<MainLayout />}>
        <Route path="/"                  element={<Home />} />
        <Route path="/portfolio"         element={<Portfolio />} />
        <Route path="/book"              element={<BookingPage />} />
        <Route path="/about"             element={<About />} />
        <Route path="/contact"           element={<Contact />} />
        <Route path="/my-bookings"       element={<MyBookings />} />
        <Route path="/my-consultation"   element={<MyConsultation />} />
        <Route path="/my-reviews"        element={<MyReviews />} />
        <Route path="/notifications"     element={<Notifications />} />
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
      </Route>

      {/* ── Admin routes (protected) ── */}
      <Route element={<AdminGuard />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin"                    element={<AdminDashboard />} />
          <Route path="/admin/tattoos"            element={<TattoosManagement />} />
          <Route path="/admin/bookings"           element={<BookingsManagement />} />
          <Route path="/admin/consultations"      element={<ConsultationsManagement />} />
          <Route path="/admin/reviews"            element={<ReviewsManagement />} />
          <Route path="/admin/*"                  element={<Navigate to="/admin" replace />} />
        </Route>
      </Route>

      {/* ── 404 ── */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <p className="text-brand-accent text-6xl font-display mb-4">404</p>
              <p className="text-white/60">Page not found</p>
            </div>
          </div>
        }
      />
    </Routes>
  );
}

export default AppRoutes;
