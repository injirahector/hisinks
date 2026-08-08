import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

const CATEGORIES = [
  'All',
  'Fine Line',
  'Black & Grey',
  'Neo-Traditional',
  'Traditional',
  'Geometric',
  'Watercolor',
  'Tribal',
  'Realism',
  'Minimalist',
  'Other',
];

function Portfolio() {
  const [tattoos, setTattoos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [filter, setFilter]     = useState('All');
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/tattoos?limit=100')
      .then((r) => setTattoos(r.data.data.tattoos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered =
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
    <div className="pt-24 pb-24 min-h-screen">
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-4">Our Work</p>
          <h1 className="font-display text-5xl md:text-6xl mb-5">Portfolio</h1>
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

        {/* Error */}
        {error && (
          <p className="text-center text-red-400 text-sm mb-8">{error}</p>
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-white/30 mb-6">No designs in this category yet.</p>
            <Link to="/book" className="btn-outline text-xs py-2 px-6">
              Request a custom design
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((t) => (
              <button
                key={t._id}
                onClick={() => setSelected(t)}
                className="group relative aspect-square overflow-hidden bg-white/5 text-left"
              >
                <img
                  src={t.image}
                  alt={t.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {/* Hover overlay */}
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

        {/* CTA */}
        {!loading && filtered.length > 0 && (
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
              src={selected.image}
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
    </div>
  );
}

export default Portfolio;
