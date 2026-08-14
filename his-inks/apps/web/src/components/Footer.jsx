import { Link } from 'react-router-dom';

function Footer() {
  return (
    <footer className="border-t border-white/5 bg-white/[0.015] pt-10 pb-5">
      <div className="max-w-7xl mx-auto px-6">

        {/* Main footer grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">

          {/* Brand */}
          <div className="lg:col-span-1">
            <p className="text-brand-accent font-display tracking-widest uppercase text-xs mb-1.5">
              His Inks Studio
            </p>
            <p className="text-white/30 text-xs leading-relaxed mb-4">
              Private, appointment-only tattoo studio.<br />Custom designs. Timeless art.
            </p>
            {/* Social icons */}
            <div className="flex gap-2.5">
              <a href="https://instagram.com/his_inks" target="_blank" rel="noreferrer"
                title="@his_inks on Instagram"
                className="w-8 h-8 border border-white/10 hover:border-brand-accent/50 flex items-center justify-center transition-colors group">
                <svg className="w-3.5 h-3.5 text-white/35 group-hover:text-brand-accent transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>
              <a href="https://tiktok.com/@his_inks" target="_blank" rel="noreferrer"
                title="@his_inks on TikTok"
                className="w-8 h-8 border border-white/10 hover:border-brand-accent/50 flex items-center justify-center transition-colors group">
                <svg className="w-3.5 h-3.5 text-white/35 group-hover:text-brand-accent transition-colors" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" />
                </svg>
              </a>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-white/25 text-xs">Instagram: <span className="text-white/45">@his_inks</span></p>
              <p className="text-white/25 text-xs">TikTok: <span className="text-white/45">@his_inks</span></p>
            </div>
          </div>

          {/* Studio Info */}
          <div className="lg:col-span-1">
            <p className="text-white/30 text-xs tracking-widest uppercase mb-3">Studio Info</p>
            <div className="space-y-2.5">

              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Phone / WhatsApp</p>
                <a href="tel:+254112146636" className="text-white/60 hover:text-brand-accent transition-colors text-xs block">
                  +254 112 146 636
                </a>
                <a href="tel:+254100664414" className="text-white/60 hover:text-brand-accent transition-colors text-xs block mt-0.5">
                  +254 100 664 414
                </a>
              </div>

              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Email</p>
                <a href="mailto:injira@hisink.com" className="text-white/60 hover:text-brand-accent transition-colors text-xs">
                  injira@hisink.com
                </a>
              </div>

              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Location</p>
                <p className="text-white/60 text-xs">Eldoret, Kapsabet &amp; Kisumu</p>
                <p className="text-white/30 text-[11px] mt-0.5">Exact address shared on booking confirmation</p>
              </div>

              <div>
                <p className="text-white/25 text-[10px] uppercase tracking-widest mb-0.5">Hours</p>
                <p className="text-white/60 text-xs">Mon – Sat: 9:00 AM – 7:00 PM</p>
                <p className="text-white/30 text-[11px] mt-0.5">By appointment only</p>
              </div>

            </div>
          </div>

          {/* Quick links */}
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-3">Quick Links</p>
            <ul className="space-y-1.5">
              {[
                { label: 'Home',        to: '/'               },
                { label: 'Portfolio',   to: '/portfolio'      },
                { label: 'About',       to: '/about'          },
                { label: 'Book',        to: '/book'           },
                { label: 'Login',       to: '/login'          },
                { label: 'Sign Up',     to: '/register'       },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to}
                    className="text-white/40 hover:text-brand-accent text-xs transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Book CTA */}
          <div>
            <p className="text-white/30 text-xs tracking-widest uppercase mb-3">Ready to Book?</p>
            <p className="text-white/40 text-xs leading-relaxed mb-4">
              Submit a booking request and we'll get back to you within 24–48 hours.
            </p>
            <Link to="/book"
              className="inline-block px-5 py-2 border border-brand-accent/40 bg-brand-accent/10
                         text-brand-accent text-xs font-semibold tracking-wider uppercase
                         hover:bg-brand-accent/20 transition-colors">
              Book an Appointment
            </Link>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-white/20 text-[11px] tracking-wider">
            &copy; {new Date().getFullYear()} His Inks Studio. All rights reserved.
          </p>
          <p className="text-white/15 text-[11px]">By appointment only · Eldoret · Kapsabet · Kisumu</p>
        </div>

      </div>
    </footer>
  );
}

export default Footer;
