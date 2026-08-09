/**
 * MaintenancePage
 *
 * Shown to all visitors when VITE_MAINTENANCE_MODE=true.
 * - Uses existing His Inks brand tokens (bg-brand-bg, brand-accent, font-display, font-body)
 * - Requires no authentication and makes zero API calls
 * - Works on desktop and mobile
 */
function MaintenancePage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6 py-16">
      {/* ── Decorative top rule ───────────────────────────────────────────── */}
      <div className="w-16 h-px bg-brand-accent mb-10" />

      {/* ── Studio name ──────────────────────────────────────────────────── */}
      <h1 className="font-display text-brand-accent text-4xl sm:text-5xl tracking-widest uppercase text-center mb-6">
        His Inks
      </h1>

      {/* ── Sub-headline ─────────────────────────────────────────────────── */}
      <p className="text-white/70 text-sm tracking-widest uppercase text-center mb-10">
        We&rsquo;re currently making improvements to the platform
      </p>

      {/* ── Divider ──────────────────────────────────────────────────────── */}
      <div className="w-8 h-px bg-brand-accent/40 mb-10" />

      {/* ── Main message ─────────────────────────────────────────────────── */}
      <div className="max-w-md w-full text-center space-y-4">
        <p className="text-white/90 text-base leading-relaxed">
          The His Inks website is temporarily unavailable while we perform system updates.
        </p>
        <p className="text-white/60 text-sm leading-relaxed">
          Please check back shortly.
        </p>
      </div>

      {/* ── Spacer ───────────────────────────────────────────────────────── */}
      <div className="mt-12 text-white/30 text-xs tracking-widest uppercase">
        Thank you for your patience
      </div>

      {/* ── Decorative bottom rule ────────────────────────────────────────── */}
      <div className="w-16 h-px bg-brand-accent mt-10" />
    </div>
  );
}

export default MaintenancePage;
