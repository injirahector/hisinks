import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';

const STARS = [1, 2, 3, 4, 5];

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {STARS.map((s) => (
        <svg key={s} className={`w-4 h-4 ${s <= rating ? 'text-brand-accent' : 'text-white/15'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const SERVICES = [
  { title: 'Custom Designs', desc: 'Original artwork created exclusively for you.' },
  { title: 'Fine Line',      desc: 'Delicate, precise linework for minimal aesthetics.' },
  { title: 'Black & Grey',   desc: 'Timeless shading and depth in monochrome.' },
  { title: 'Cover-Ups',      desc: 'Transform old ink into something new.' },
  { title: 'Touch-Ups',      desc: 'Keep your tattoos looking fresh and vibrant.' },
  { title: 'Consultations',  desc: 'Free design consultation before every booking.' },
];

function Home() {
  const [reviews, setReviews] = useState([]);
  const [stats,   setStats]   = useState(null);

  useEffect(() => {
    api.get('/reviews/featured?limit=3')
      .then((r) => setReviews(r.data.data.reviews))
      .catch(() => {});
    api.get('/reviews/stats')
      .then((r) => setStats(r.data.data.stats))
      .catch(() => {});
  }, []);
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-brand-bg"
          style={{
            backgroundImage:
              'radial-gradient(ellipse at 50% 60%, rgba(196,154,68,0.08) 0%, transparent 70%)',
          }}
        />
        <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-6">
            Premium Tattoo Art
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-tight mb-6">
            His Inks{' '}
            <span className="italic text-brand-accent">Studio</span>
          </h1>
          <p className="text-white/50 text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Where skin becomes a canvas. Bespoke tattoo artistry crafted with
            precision, passion, and permanent beauty.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/book" className="btn-primary">Book an Appointment</Link>
            <Link to="/portfolio" className="btn-outline">View Portfolio</Link>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-accent/30 to-transparent" />
      </section>

      {/* ── About Teaser ─────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 grid md:grid-cols-2 gap-16 items-center">
        <div>
          <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">About the Studio</p>
          <h2 className="font-display text-4xl mb-6 leading-snug">Art that lives with you</h2>
          <p className="text-white/50 leading-relaxed mb-4">
            His Inks Studio is a private tattoo studio dedicated to creating bespoke, fine-line, and
            custom tattoo pieces for clients who appreciate artistry over mass production.
          </p>
          <p className="text-white/50 leading-relaxed mb-8">
            Every piece is a collaboration — your story told through ink, with care and precision
            that lasts a lifetime.
          </p>
          <Link to="/about" className="btn-outline text-xs py-2.5 px-6">Learn More</Link>
        </div>
        <div className="aspect-square bg-white/5 border border-white/10 flex items-center justify-center">
          <p className="text-white/20 text-sm tracking-widest uppercase">Studio Image</p>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="bg-white/[0.02] border-y border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">What We Offer</p>
          <h2 className="font-display text-4xl mb-16">Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {SERVICES.map((s) => (
              <div key={s.title}
                className="border border-white/10 p-8 text-left hover:border-brand-accent/40 transition-colors duration-300">
                <div className="w-8 h-px bg-brand-accent mb-6" />
                <h3 className="font-display text-xl mb-3">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio Preview CTA ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">The Work</p>
        <h2 className="font-display text-4xl mb-5">See the Portfolio</h2>
        <p className="text-white/40 mb-10 max-w-md mx-auto leading-relaxed">
          Browse our collection of custom tattoo designs — each one unique, each one permanent.
        </p>
        <Link to="/portfolio" className="btn-outline">View All Work</Link>
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      {(stats?.totalReviews > 0 || reviews.length > 0) && (
        <section className="max-w-7xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">Client Stories</p>
            <h2 className="font-display text-4xl mb-4">What Clients Say</h2>
            {stats && stats.totalReviews > 0 && (
              <div className="flex items-center justify-center gap-3 mt-4">
                <StarDisplay rating={Math.round(stats.averageRating)} />
                <span className="text-brand-accent font-display text-xl">{stats.averageRating}</span>
                <span className="text-white/30 text-sm">
                  from {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r._id} className="border border-white/10 p-6 flex flex-col gap-4
                                            hover:border-brand-accent/30 transition-colors duration-300">
                  <StarDisplay rating={r.rating} />
                  {r.title && (
                    <p className="text-white font-medium leading-snug">{r.title}</p>
                  )}
                  <p className="text-white/55 text-sm leading-relaxed flex-1">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  {r.artistReply && (
                    <div className="border-t border-white/8 pt-3">
                      <p className="text-brand-accent text-xs uppercase tracking-widest mb-1">Studio</p>
                      <p className="text-white/40 text-xs leading-relaxed">{r.artistReply}</p>
                    </div>
                  )}
                  <div className="border-t border-white/8 pt-3 flex items-center gap-2">
                    {r.customer?.profileImage ? (
                      <img src={r.customer.profileImage} alt=""
                        className="w-7 h-7 rounded-full object-cover border border-white/10" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-brand-accent/15 border border-brand-accent/20
                                      flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-accent text-[10px] font-medium">
                          {r.customer?.firstName?.[0]}{r.customer?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <p className="text-white/50 text-xs">
                      {r.customer?.firstName} {r.customer?.lastName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="bg-white/[0.02] border-t border-white/5 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-5xl mb-6">
            Ready to start your{' '}
            <span className="italic text-brand-accent">tattoo journey?</span>
          </h2>
          <p className="text-white/40 mb-10 max-w-md mx-auto">
            Book a consultation and let&apos;s bring your vision to life.
          </p>
          <Link to="/book" className="btn-primary">Book an Appointment</Link>
        </div>
      </section>
    </>
  );
}

export default Home;
