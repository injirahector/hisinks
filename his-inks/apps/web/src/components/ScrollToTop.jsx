import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Scrolls the window to (0, 0) on every route change.
 * Must be rendered inside a Router. Works with BrowserRouter (no data router needed).
 * Place this once near the top of the component tree — MainLayout is the right spot.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use 'instant' so there is no visible smooth-scroll animation back to top.
    // 'smooth' would cause the page to visibly slide up on every navigation.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
