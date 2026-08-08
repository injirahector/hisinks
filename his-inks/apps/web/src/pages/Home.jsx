import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import api from '../services/api';
import { getImageUrl } from '../utils/imageUrl';

const STARS = [1, 2, 3, 4, 5];

function StarDisplay({ rating }) {
  return (
    <div className="flex gap-0.5">
      {STARS.map((s) => (
        <svg key={s} className={`w-3.5 h-3.5 ${s <= rating ? 'text-brand-accent' : 'text-white/15'}`}
          fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

const SERVICES = [
  {
    title: 'Custom Designs',
    desc: 'Original artwork created exclusively for you. No flash, no repeats.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
    ),
  },
  {
    title: 'Fine Line',
    desc: 'Delicate, precise linework for those who appreciate minimal elegance.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
    ),
  },
  {
    title: 'Black & Grey',
    desc: 'Timeless shading and depth rendered in monochrome mastery.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    ),
  },
  {
    title: 'Cover-Ups',
    desc: 'Transform old ink into something bold and beautiful.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    ),
  },
  {
    title: 'Touch-Ups',
    desc: 'Keep your tattoos sharp, vibrant, and looking freshly done.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    ),
  },
  {
    title: 'Consultations',
    desc: 'Free design consultation before every session — no surprises.',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    ),
  },
];

const PROCESS = [
  { step: '01', title: 'Submit a Request', desc: 'Fill out the booking form with your idea, placement, and preferred date.' },
  { step: '02', title: 'Consultation', desc: 'We discuss your vision, answer questions, and finalise the concept together.' },
  { step: '03', title: 'Design & Deposit', desc: 'Custom artwork is created for your approval. A small deposit confirms your slot.' },
  { step: '04', title: 'Your Session', desc: 'We bring your tattoo to life in a clean, private, comfortable environment.' },
];

const CATEGORIES = [
  'All', 'Fine Line', 'Black & Grey', 'Neo-Traditional', 'Traditional',
  'Geometric', 'Watercolor', 'Tribal', 'Realism', 'Minimalist', 'Other',
];

const VALUES = [
  {
    title: 'Custom Only',
    desc: 'Every design is created exclusively for you. No flash, no repeats — your tattoo belongs to you alone.',
  },
  {
    title: 'Fine Craftsmanship',
    desc: 'Using premium inks and sterile, single-use equipment. Your safety and the quality of the work are non-negotiable.',
  },
  {
    title: 'Collaborative Process',
    desc: 'We sit down together before every session to make sure the design perfectly captures your vision.',
  },
  {
    title: 'Lasting Art',
    desc: 'Techniques chosen to age gracefully on your skin — so your tattoo looks as good in 20 years as the day it was done.',
  },
];

function Home() {
  const navigate = useNavigate();
  const [reviews,        setReviews]        = useState([]);
  const [stats,          setStats]          = useState(null);
  const [tattoos,        setTattoos]        = useState([]);
  const [tattooLoading,  setTattooLoading]  = useState(true);
  const [filter,         setFilter]         = useState('All');
  const [selected,       setSelected]       = useState(null);

  useEffect(() => {
    api.get('/reviews/featured?limit=3')
      .then((r) => setReviews(r.data.data.reviews))
      .catch(() => {});
    api.get('/reviews/stats')
      .then((r) => setStats(r.data.data.stats))
      .catch(() => {});
    api.get('/tattoos?limit=100')
      .then((r) => { setTattoos(r.data.data.tattoos); setTattooLoading(false); })
      .catch(() => setTattooLoading(false));
  }, []);

  const filteredTattoos =
    filter === 'All' ? tattoos : tattoos.filter((t) => t.category === filter);

  const handleBookThisStyle = (tattoo) => {
    setSelected(null);
    navigate('/my-consultation', {
      state: {
        tattooRef: {
          title:       tattoo.title       || '',
          image:       tattoo.image       || '',
          category:    tattoo.category    || '',
          description: tattoo.description || '',
        },
      },
    });
  };

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">

        {/* Background image — Ken Burns zoom 100→104% over 18s, cover + center */}
        <div
          className="absolute inset-0 bg-center bg-cover animate-hero-zoom"
          style={{
            backgroundImage: 'url(/images/hero/hero-background.webp)',
            backgroundColor: '#0B0B0B',
            willChange: 'transform',
          }}
        />

        {/* Dark gradient overlay ~65% — preserves image while keeping text readable */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(11,11,11,0.50) 0%, rgba(11,11,11,0.65) 45%, rgba(11,11,11,0.88) 100%)',
          }}
        />

        {/* Subtle gold glow at centre-bottom */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 80%, rgba(196,154,68,0.06) 0%, transparent 70%)',
          }}
        />

        {/* Hero content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">

          {/* Label */}
          <div
            className="inline-flex items-center gap-3 mb-8 animate-fade-in"
            style={{ animationDelay: '0.2s', animationFillMode: 'both' }}
          >
            <div className="w-8 h-px bg-brand-accent" />
            <p className="text-brand-accent tracking-[0.5em] uppercase text-xs">Premium Tattoo Art · Kenya</p>
            <div className="w-8 h-px bg-brand-accent" />
          </div>

          {/* Title */}
          <h1
            className="font-display text-7xl md:text-9xl leading-none tracking-tight mb-4 animate-fade-in"
            style={{ animationDelay: '0.4s', animationFillMode: 'both' }}
          >
            HIS INKS
          </h1>

          {/* Subtitle */}
          <p
            className="font-display italic text-2xl md:text-3xl text-brand-accent mb-6 animate-slide-up"
            style={{ animationDelay: '0.65s', animationFillMode: 'both' }}
          >
            Custom Tattoos. Timeless Art.
          </p>

          {/* Description */}
          <p
            className="text-white/50 text-base md:text-lg max-w-lg mx-auto mb-12 leading-relaxed font-light animate-slide-up"
            style={{ animationDelay: '0.85s', animationFillMode: 'both' }}
          >
            Professional tattoo artistry crafted with precision, creativity, and passion.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up"
            style={{ animationDelay: '1.05s', animationFillMode: 'both' }}
          >
            <Link to="/book" className="btn-primary px-10 py-4 w-full sm:w-auto">
              Book Appointment
            </Link>
            <a href="#portfolio" className="btn-outline px-10 py-4 w-full sm:w-auto">
              View Portfolio
            </a>
          </div>

          {/* Star rating */}
          {stats && stats.totalReviews > 0 && (
            <div
              className="mt-14 flex items-center justify-center gap-2 animate-fade-in"
              style={{ animationDelay: '1.3s', animationFillMode: 'both' }}
            >
              <StarDisplay rating={Math.round(stats.averageRating)} />
              <span className="text-white/40 text-sm ml-1">
                <span className="text-brand-accent font-medium">{stats.averageRating}</span>
                {' '}— {stats.totalReviews} verified reviews
              </span>
            </div>
          )}
        </div>

        {/* Bottom fade into next section */}
        <div
          className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, transparent, #0B0B0B)' }}
        />

        {/* Scroll indicator */}
        <div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-in"
          style={{ animationDelay: '1.6s', animationFillMode: 'both' }}
          aria-hidden="true"
        >
          <span className="text-white/20 text-[10px] tracking-[0.3em] uppercase mb-2">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-white/30 to-transparent animate-scroll-line" />
        </div>
      </section>

      {/* ── Studio Stats Bar ──────────────────────────────────────────────── */}
      <section className="border-y border-white/5 bg-white/[0.015]">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '500+', label: 'Tattoos Done' },
              { value: '100%', label: 'Custom Designs' },
              { value: '5★',   label: 'Client Rating' },
              { value: 'Private', label: 'Appointment Only' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl text-brand-accent mb-1">{stat.value}</p>
                <p className="text-white/30 text-xs tracking-widest uppercase">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About / Studio Image ──────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          {/* Image side */}
          <div className="relative">
            <div className="absolute -inset-3 border border-brand-accent/10" />
            <img
              src="/studio_image.PNG"
              alt="His Inks Studio"
              className="relative w-full h-auto object-contain"
            />
            {/* Floating badge */}
            <div className="absolute -bottom-5 -right-5 bg-brand-bg border border-brand-accent/30 px-5 py-3">
              <p className="text-brand-accent font-display text-sm">By Appointment Only</p>
              <p className="text-white/30 text-xs mt-0.5">Eldoret · Kapsabet · Kisumu</p>
            </div>
          </div>

          {/* Text side */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-brand-accent" />
              <p className="text-brand-accent tracking-[0.3em] uppercase text-xs">About the Studio</p>
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-7 leading-snug">
              Art that lives<br />
              <span className="italic text-brand-accent">with you</span>
            </h2>
            <p className="text-white/50 leading-relaxed mb-4">
              His Inks Studio is a private, appointment-only tattoo studio dedicated to creating
              bespoke, fine-line, and custom pieces for clients who value artistry over mass production.
            </p>
            <p className="text-white/50 leading-relaxed mb-10">
              Every tattoo is a collaboration — your story told through ink, with care and
              precision that lasts a lifetime. No walk-ins. No rush jobs. Just you, your vision,
              and the craft.
            </p>
            <div className="flex items-center gap-6">
              <a href="#about" className="btn-outline text-xs py-3 px-7">Our Story</a>
              <a href="#portfolio" className="text-brand-accent text-xs tracking-widest uppercase hover:opacity-70 transition-opacity">
                See the Work →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────── */}
      <section className="bg-white/[0.02] border-y border-white/5 py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-px bg-brand-accent" />
              <p className="text-brand-accent tracking-[0.3em] uppercase text-xs">What We Offer</p>
              <div className="w-8 h-px bg-brand-accent" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl">Services</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title}
                className="group border border-white/8 p-8 text-left hover:border-brand-accent/40
                           hover:bg-white/[0.02] transition-all duration-300">
                <div className="w-9 h-9 border border-white/10 group-hover:border-brand-accent/40
                                flex items-center justify-center mb-6 transition-colors duration-300">
                  <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    {s.icon}
                  </svg>
                </div>
                <h3 className="font-display text-xl mb-3 group-hover:text-brand-accent transition-colors duration-300">
                  {s.title}
                </h3>
                <p className="text-white/35 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process ──────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 py-28">
        <div className="grid md:grid-cols-2 gap-20 items-start">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-px bg-brand-accent" />
              <p className="text-brand-accent tracking-[0.3em] uppercase text-xs">How It Works</p>
            </div>
            <h2 className="font-display text-4xl md:text-5xl leading-snug mb-6">
              Simple.<br />
              <span className="italic text-brand-accent">Seamless.</span>
            </h2>
            <p className="text-white/40 leading-relaxed mb-10 max-w-sm">
              From first message to finished piece — every step is designed to make your
              experience effortless and personal.
            </p>
            <Link to="/book" className="btn-primary text-xs py-3.5 px-8">Start the Process</Link>
          </div>
          <div className="space-y-0">
            {PROCESS.map((item, i) => (
              <div key={item.step} className={`flex gap-6 ${i < PROCESS.length - 1 ? 'pb-8' : ''}`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 border border-brand-accent/40 bg-brand-accent/5
                                  flex items-center justify-center">
                    <span className="text-brand-accent text-xs font-mono tracking-wider">{item.step}</span>
                  </div>
                  {i < PROCESS.length - 1 && (
                    <div className="flex-1 w-px bg-gradient-to-b from-brand-accent/20 to-transparent mt-2" />
                  )}
                </div>
                <div className="pt-2 pb-2">
                  <h3 className="text-white font-medium mb-1.5">{item.title}</h3>
                  <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Portfolio ───────────────────────────────────────────────────── */}
      <section id="portfolio" className="border-y border-white/5 bg-white/[0.015] py-28">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-px bg-brand-accent" />
              <p className="text-brand-accent tracking-[0.4em] uppercase text-xs">Our Work</p>
              <div className="w-8 h-px bg-brand-accent" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-5">Portfolio</h2>
            <p className="text-white/40 max-w-lg mx-auto leading-relaxed">
              A curated collection of bespoke tattoo art. Each piece is one of a kind.
            </p>
          </div>

          {/* Category filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-1.5 text-xs tracking-widest uppercase border transition-colors duration-200
                  ${filter === cat
                    ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                    : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {tattooLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredTattoos.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white/30 mb-6">No designs in this category yet.</p>
              <Link to="/book" className="btn-outline text-xs py-2 px-6">
                Request a custom design
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTattoos.map((t) => (
                <button
                  key={t._id}
                  onClick={() => setSelected(t)}
                  className="group relative aspect-square overflow-hidden bg-white/5 text-left"
                >
                  <img
                    src={getImageUrl(t.image)}
                    alt={t.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-brand-bg/70 opacity-0 group-hover:opacity-100
                                  transition-opacity duration-300 flex flex-col items-center justify-center p-4">
                    <p className="text-white font-display text-lg text-center mb-1">{t.title}</p>
                    <p className="text-brand-accent text-xs tracking-widest uppercase">{t.category}</p>
                    {t.priceRange && (
                      <p className="text-white/50 text-xs mt-2">{t.priceRange}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {!tattooLoading && filteredTattoos.length > 0 && (
            <div className="text-center mt-16">
              <p className="text-white/40 mb-6">Inspired by what you see?</p>
              <Link to="/book" className="btn-primary">Book an Appointment</Link>
            </div>
          )}
        </div>

        {/* Lightbox */}
        {selected && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="relative max-w-2xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute -top-10 right-0 text-white/50 hover:text-white text-sm tracking-widest uppercase"
              >
                Close ✕
              </button>
              <img
                src={getImageUrl(selected.image)}
                alt={selected.title}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
              <div className="bg-[#111] border-t border-white/8 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white font-display text-xl mb-1">{selected.title}</p>
                    <p className="text-brand-accent text-xs tracking-widest uppercase mb-2">
                      {selected.category}
                    </p>
                    {selected.description && (
                      <p className="text-white/40 text-sm leading-relaxed">{selected.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {selected.priceRange && (
                      <p className="text-brand-accent text-sm font-medium">{selected.priceRange}</p>
                    )}
                    <button
                      onClick={() => handleBookThisStyle(selected)}
                      className="mt-3 inline-block btn-primary text-xs py-2 px-4"
                    >
                      Book This Style
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Reviews ───────────────────────────────────────────────────────── */}
      {(stats?.totalReviews > 0 || reviews.length > 0) && (
        <section className="max-w-7xl mx-auto px-6 py-28">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-px bg-brand-accent" />
              <p className="text-brand-accent tracking-[0.3em] uppercase text-xs">Client Stories</p>
              <div className="w-8 h-px bg-brand-accent" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-4">What Clients Say</h2>
            {stats && stats.totalReviews > 0 && (
              <div className="flex items-center justify-center gap-3 mt-5">
                <StarDisplay rating={Math.round(stats.averageRating)} />
                <span className="text-brand-accent font-display text-xl">{stats.averageRating}</span>
                <span className="text-white/25 text-sm">
                  from {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}
          </div>

          {reviews.length > 0 && (
            <div className="grid md:grid-cols-3 gap-6">
              {reviews.map((r) => (
                <div key={r._id}
                  className="border border-white/8 p-7 flex flex-col gap-4
                             hover:border-brand-accent/25 transition-colors duration-300">
                  <StarDisplay rating={r.rating} />
                  {r.title && (
                    <p className="text-white font-display text-lg leading-snug">{r.title}</p>
                  )}
                  <p className="text-white/45 text-sm leading-relaxed flex-1">
                    &ldquo;{r.comment}&rdquo;
                  </p>
                  {r.artistReply && (
                    <div className="border-t border-white/8 pt-4">
                      <p className="text-brand-accent text-[10px] uppercase tracking-widest mb-1.5">Studio Reply</p>
                      <p className="text-white/35 text-xs leading-relaxed">{r.artistReply}</p>
                    </div>
                  )}
                  <div className="border-t border-white/8 pt-4 flex items-center gap-3">
                    {r.customer?.profileImage ? (
                      <img src={r.customer.profileImage} alt=""
                        className="w-8 h-8 rounded-full object-cover border border-white/10 flex-shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20
                                      flex items-center justify-center flex-shrink-0">
                        <span className="text-brand-accent text-[10px] font-medium">
                          {r.customer?.firstName?.[0]}{r.customer?.lastName?.[0]}
                        </span>
                      </div>
                    )}
                    <p className="text-white/40 text-xs">
                      {r.customer?.firstName} {r.customer?.lastName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="max-w-7xl mx-auto px-6 py-28">

        {/* Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-8 h-px bg-brand-accent" />
            <p className="text-brand-accent tracking-[0.4em] uppercase text-xs">Our Story</p>
            <div className="w-8 h-px bg-brand-accent" />
          </div>
          <h2 className="font-display text-4xl md:text-5xl mb-6">About His Inks</h2>
          <p className="text-white/40 max-w-xl mx-auto leading-relaxed">
            A private tattoo studio built on one principle — that permanent art deserves permanent care.
          </p>
        </div>

        {/* Story */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div>
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">The Studio</p>
            <h3 className="font-display text-3xl md:text-4xl mb-6 leading-snug">
              Where skin becomes a canvas
            </h3>
            <div className="space-y-4 text-white/50 leading-relaxed">
              <p>
                His Inks Studio was born from a passion for fine art and the belief that tattoos are one
                of the most intimate forms of self-expression. Every mark made is deliberate, every line
                considered.
              </p>
              <p>
                Operating as a private, appointment-only studio, we offer each client our undivided
                attention. There are no walk-ins, no rush jobs — just dedicated time and craft given to
                your piece.
              </p>
              <p>
                From delicate fine-line work to bold realism, the studio specialises in custom designs
                that are as individual as the person wearing them.
              </p>
            </div>
          </div>
          <div className="overflow-hidden">
            <img
              src="/studio_image.PNG"
              alt="His Inks Studio"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Values */}
        <div className="mb-24">
          <div className="text-center mb-12">
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-3">What We Stand For</p>
            <h3 className="font-display text-3xl">Our Values</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((v) => (
              <div key={v.title}
                className="border border-white/10 p-7 hover:border-brand-accent/40 transition-colors duration-300">
                <div className="w-8 h-px bg-brand-accent mb-5" />
                <h4 className="font-display text-lg mb-3">{v.title}</h4>
                <p className="text-white/40 text-sm leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Extended Process */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-3">How It Works</p>
            <h3 className="font-display text-3xl">The Process</h3>
          </div>
          <div className="space-y-0">
            {[
              { step: '01', title: 'Submit a Request', desc: 'Fill out the booking form with your tattoo idea, placement, and preferred date.' },
              { step: '02', title: 'Consultation', desc: "We'll reach out to discuss your vision, answer questions, and finalise the design concept." },
              { step: '03', title: 'Design Review', desc: 'A custom design is created for your approval before the session begins.' },
              { step: '04', title: 'Your Session', desc: 'We create your tattoo in a clean, private environment with your full comfort in mind.' },
              { step: '05', title: 'Aftercare', desc: 'We provide full aftercare instructions and a complimentary touch-up if needed.' },
            ].map((item, i, arr) => (
              <div key={item.step} className={`flex gap-6 ${i < arr.length - 1 ? 'pb-8' : ''}`}>
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-10 h-10 border border-brand-accent/40 bg-brand-accent/5
                                  flex items-center justify-center">
                    <span className="text-brand-accent text-xs font-mono tracking-wider">{item.step}</span>
                  </div>
                  {i < arr.length - 1 && (
                    <div className="flex-1 w-px bg-gradient-to-b from-brand-accent/20 to-transparent mt-2" />
                  )}
                </div>
                <div className="pt-2 pb-2">
                  <h4 className="text-white font-medium mb-1.5">{item.title}</h4>
                  <p className="text-white/35 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      <section id="contact" className="border-t border-white/5 bg-white/[0.015] py-28">
        <div className="max-w-7xl mx-auto px-6">

          {/* Header */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-8 h-px bg-brand-accent" />
              <p className="text-brand-accent tracking-[0.4em] uppercase text-xs">Get In Touch</p>
              <div className="w-8 h-px bg-brand-accent" />
            </div>
            <h2 className="font-display text-4xl md:text-5xl mb-5">Contact</h2>
            <p className="text-white/40 max-w-md mx-auto leading-relaxed">
              Have a question before booking? Reach out directly and we&apos;ll get back to you.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">

            {/* Studio info */}
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
                      <a href="tel:+254112146636" className="text-white hover:text-brand-accent transition-colors text-sm block">
                        +254 112 146 636
                      </a>
                      <a href="tel:+254100664414" className="text-white hover:text-brand-accent transition-colors text-sm block mt-0.5">
                        +254 100 664 414
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
                      <a href="mailto:injira@hisink.com" className="text-white hover:text-brand-accent transition-colors text-sm">
                        injira@hisink.com
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs tracking-widest uppercase mb-1">Location</p>
                      <p className="text-white text-sm">Eldoret, Kapsabet &amp; Kisumu</p>
                      <p className="text-white/40 text-xs mt-0.5">Exact address shared on booking confirmation</p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-brand-accent" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                  <a href="https://instagram.com/his_inks" target="_blank" rel="noreferrer"
                    className="w-10 h-10 border border-white/10 hover:border-brand-accent/50
                               flex items-center justify-center transition-colors group"
                    title="@his_inks on Instagram">
                    <svg className="w-4 h-4 text-white/40 group-hover:text-brand-accent transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  </a>
                  <a href="https://tiktok.com/@his_inks" target="_blank" rel="noreferrer"
                    className="w-10 h-10 border border-white/10 hover:border-brand-accent/50
                               flex items-center justify-center transition-colors group"
                    title="@his_inks on TikTok">
                    <svg className="w-4 h-4 text-white/40 group-hover:text-brand-accent transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.19 8.19 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z" />
                    </svg>
                  </a>
                </div>
                <div className="flex gap-4 mt-3">
                  <p className="text-white/25 text-xs">Instagram: <span className="text-white/50">@his_inks</span></p>
                  <p className="text-white/25 text-xs">TikTok: <span className="text-white/50">@his_inks</span></p>
                </div>
              </div>
            </div>

            {/* Booking CTA card */}
            <div className="border border-white/8 p-8 flex flex-col justify-between">
              <div>
                <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-4">Ready to book?</p>
                <h3 className="font-display text-3xl mb-4 leading-snug">
                  Let&apos;s create something permanent
                </h3>
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
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/5 py-32">
        <div className="absolute inset-0 bg-brand-bg" />
        <div className="absolute inset-0"
          style={{ backgroundImage: 'radial-gradient(ellipse 60% 80% at 50% 100%, rgba(196,154,68,0.08) 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-8 h-px bg-brand-accent" />
            <p className="text-brand-accent tracking-[0.4em] uppercase text-xs">Ready?</p>
            <div className="w-8 h-px bg-brand-accent" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl mb-6 leading-tight">
            Ready to start your{' '}
            <span className="italic text-brand-accent">tattoo journey?</span>
          </h2>
          <p className="text-white/35 mb-12 max-w-md mx-auto leading-relaxed">
            Book a consultation and let&apos;s bring your vision to life.
            Every great tattoo starts with a conversation.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/book" className="btn-primary px-12 py-4">Book an Appointment</Link>
            <a href="#contact" className="btn-outline px-12 py-4">Get in Touch</a>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
