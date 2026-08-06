import { Link } from 'react-router-dom';

function Contact() {
  return (
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Get In Touch</p>
          <h1 className="font-display text-5xl md:text-6xl mb-5">Contact</h1>
          <p className="text-white/40 max-w-md mx-auto leading-relaxed">
            Have a question before booking? Reach out directly and we&apos;ll get back to you.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">

          {/* Contact details */}
          <div className="space-y-8">
            <div>
              <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-6">Studio Info</p>
              <div className="space-y-6">

                <div className="flex gap-4">
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Phone / WhatsApp</p>
                    <a href="tel:+254700000000"
                      className="text-white hover:text-brand-accent transition-colors text-sm">
                      +254 700 000 000
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Email</p>
                    <a href="mailto:injira@hisink.com"
                      className="text-white hover:text-brand-accent transition-colors text-sm">
                      injira@hisink.com
                    </a>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Location</p>
                    <p className="text-white text-sm">Nairobi, Kenya</p>
                    <p className="text-white/40 text-xs mt-0.5">Exact address shared on booking confirmation</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Hours</p>
                    <p className="text-white text-sm">Mon – Sat: 9:00 AM – 7:00 PM</p>
                    <p className="text-white/40 text-xs mt-0.5">By appointment only</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Social */}
            <div>
              <p className="text-white/30 text-xs tracking-widest uppercase mb-4">Follow the Work</p>
              <div className="flex gap-3">
                <a href="https://instagram.com" target="_blank" rel="noreferrer"
                  className="w-10 h-10 border border-white/10 hover:border-brand-accent/50
                             flex items-center justify-center transition-colors group">
                  <svg className="w-4 h-4 text-white/40 group-hover:text-brand-accent transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noreferrer"
                  className="w-10 h-10 border border-white/10 hover:border-brand-accent/50
                             flex items-center justify-center transition-colors group">
                  <svg className="w-4 h-4 text-white/40 group-hover:text-brand-accent transition-colors" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Booking CTA card */}
          <div className="border border-white/8 p-8 flex flex-col justify-between">
            <div>
              <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">Ready to book?</p>
              <h2 className="font-display text-3xl mb-4 leading-snug">
                Let&apos;s create something permanent
              </h2>
              <p className="text-white/40 leading-relaxed mb-8 text-sm">
                The fastest way to get started is to submit a booking request.
                We&apos;ll review your idea and reach out within 24–48 hours.
              </p>
              <ul className="space-y-2 mb-8">
                {['Free design consultation', 'Custom artwork created for you', 'Flexible scheduling', 'Premium inks & equipment'].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-white/50 text-sm">
                    <div className="w-1 h-1 rounded-full bg-brand-accent flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link to="/book" className="btn-primary text-center text-xs py-3.5">
              Book an Appointment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
