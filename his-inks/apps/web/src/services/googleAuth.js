/**
 * googleAuth.js
 *
 * Thin wrapper around Google Identity Services (GIS).
 *
 * GIS exposes a global singleton.  Calling initialize() is required each time
 * a new callback needs to be registered (i.e. each page that shows a Google
 * button).  The "called multiple times" warning is a GIS quirk in React dev
 * mode (Strict Mode double-invokes effects) — it is harmless in production and
 * does not affect functionality.
 *
 * This wrapper defers the renderButton call until after the GIS script has
 * loaded, retrying with requestAnimationFrame so the button appears even when
 * the async script hasn't finished by the time the component mounts.
 */

/**
 * Initialises GIS and renders the standard Google button into the supplied
 * DOM element.  Safe to call on every component mount — GIS handles multiple
 * initialize() calls internally.
 *
 * @param {HTMLElement}  container  – ref.current of the target <div>
 * @param {Function}     callback   – called with { credential } on success
 * @param {'signin_with'|'signup_with'|'continue_with'} [text]
 * @returns {Function}  cleanup — call from useEffect return to cancel pending retry
 */
export function initGoogleButton(container, callback, text = 'signin_with') {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId || !container) return () => {};

  let rafId = null;
  let cancelled = false;

  function tryRender() {
    if (cancelled) return;

    if (!window.google?.accounts?.id) {
      // GIS script not yet loaded — retry on next animation frame
      rafId = requestAnimationFrame(tryRender);
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback,
    });

    window.google.accounts.id.renderButton(container, {
      theme: 'outline',
      size: 'large',
      width: container.offsetWidth || 400,
      text,
      shape: 'rectangular',
    });
  }

  tryRender();

  // Return cleanup so useEffect can cancel the rAF loop on unmount
  return () => {
    cancelled = true;
    if (rafId !== null) cancelAnimationFrame(rafId);
  };
}
