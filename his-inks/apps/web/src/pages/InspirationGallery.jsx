import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ── Full screen image viewer ──────────────────────────────────────────────────
function FullScreenImageViewer({ imageUrl, title, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
        title="Close (or press Esc)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Image */}
      <img
        src={imageUrl}
        alt={title}
        className="max-w-full max-h-full object-contain"
      />

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 text-white/70 text-sm">
        {title}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 right-4 text-white/50 text-xs">
        Press ESC to close
      </div>
    </div>
  );
}

// ── Detail modal ───────────────────────────────────────────────────────────────
function InspirationDetailModal({ inspiration, onClose }) {
  const navigate = useNavigate();
  const [fullScreenImage, setFullScreenImage] = useState(null);

  const handleBookConsultation = () => {
    // Pass only the inspiration ID via router state
    // Service will fetch and validate the inspiration from database
    navigate('/my-consultation', {
      state: {
        inspirationId: inspiration._id,
      },
    });
    onClose();
  };

  const handleDownloadImage = () => {
    const link = document.createElement('a');
    link.href = inspiration.image;
    link.download = `${inspiration.title.replace(/\s+/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4" onClick={onClose}>
        <div
          className="bg-[#111] border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Image */}
          <div className="relative aspect-video bg-white/5 overflow-hidden group cursor-pointer" onClick={() => setFullScreenImage(inspiration.image)}>
            <img
              src={inspiration.image}
              alt={inspiration.title}
              className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
            />
            {/* Zoom icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </div>

            {/* Download button overlay */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDownloadImage();
              }}
              className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity
                         p-2 bg-black/70 hover:bg-black/90 rounded-lg text-white"
              title="Download image"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div>
              <h2 className="font-display text-2xl text-white mb-3">{inspiration.title}</h2>
              <div className="flex items-center gap-3 flex-wrap mb-4">
                <span className="inline-block px-2.5 py-1 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-xs tracking-widest uppercase">
                  {inspiration.category}
                </span>
                {inspiration.estimatedSize && (
                  <span className="text-white/50 text-xs">{inspiration.estimatedSize}</span>
                )}
                {inspiration.suggestedPlacement && (
                  <span className="text-white/50 text-xs">Placement: {inspiration.suggestedPlacement}</span>
                )}
              </div>
            </div>

            {inspiration.description && (
              <div>
                <p className="text-white/70 text-sm leading-relaxed">{inspiration.description}</p>
              </div>
            )}

            {/* Consultation explanation */}
            <div className="border-t border-white/8 pt-6 space-y-3">
              <h3 className="text-white font-medium text-sm">Have an idea in mind?</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Use this inspiration as a starting point. Book a consultation to discuss how we can customize the design, placement, size, and details to create something unique for you.
              </p>
            </div>

            <div className="border-t border-white/8 pt-4 text-white/40 text-xs">
              Created on {fmtDate(inspiration.createdAt)}
            </div>

            {/* Single CTA: Book Consultation */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleBookConsultation}
                className="flex-1 px-4 py-3 text-xs tracking-widest uppercase border border-brand-accent/30 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20 transition-colors font-medium"
              >
                Book a Consultation
              </button>
              <button
                onClick={onClose}
                className="px-4 py-3 text-xs tracking-widest uppercase border border-white/10 text-white/50 hover:text-white hover:border-white/30 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full screen image viewer */}
      {fullScreenImage && (
        <FullScreenImageViewer
          imageUrl={fullScreenImage}
          title={inspiration.title}
          onClose={() => setFullScreenImage(null)}
        />
      )}
    </>
  );
}

// ── Gallery card ───────────────────────────────────────────────────────────────
function InspirationCard({ inspiration, onViewDetails }) {
  return (
    <div
      className="bg-white/5 border border-white/8 rounded-lg overflow-hidden hover:border-brand-accent/30 transition-colors cursor-pointer group"
      onClick={() => onViewDetails(inspiration)}
    >
      <div className="aspect-square bg-white/5 overflow-hidden">
        <img
          src={inspiration.image}
          alt={inspiration.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 space-y-2">
        <h3 className="text-white font-medium text-sm line-clamp-2">{inspiration.title}</h3>
        <p className="text-white/40 text-xs">{inspiration.category}</p>
        {inspiration.description && (
          <p className="text-white/50 text-xs line-clamp-2">{inspiration.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function InspirationGallery() {
  const [inspirations, setInspirations] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedInspiration, setSelectedInspiration] = useState(null);

  const LIMIT = 12;

  // Load categories
  useEffect(() => {
    api.get('/inspirations/categories')
      .then((r) => setAllCategories(r.data.data.categories))
      .catch((e) => console.error('Failed to load categories:', e));
  }, []);

  // Load inspirations
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit: LIMIT });
    if (search) params.set('search', search);
    if (selectedCategory) params.set('category', selectedCategory);

    api.get(`/inspirations?${params.toString()}`)
      .then((r) => {
        setInspirations(r.data.data.inspirations);
        setPagination(r.data.pagination);
      })
      .catch((e) => console.error('Failed to load inspirations:', e))
      .finally(() => setLoading(false));
  }, [page, search, selectedCategory]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="py-16 px-4 border-b border-white/8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-2">Explore</p>
          <h1 className="font-display text-4xl md:text-5xl text-white mb-4">Tattoo Inspiration</h1>
          <p className="text-white/60 text-sm md:text-base max-w-2xl mx-auto">
            Explore tattoo styles and ideas to help inspire your next piece. Whether you already have a concept
            or you're starting from scratch, we're here to help you create something unique.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="mb-8 space-y-4">
          {/* Search */}
          <div className="max-w-md">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Search inspirations..."
                className="w-full bg-white/5 border border-white/10 pl-9 pr-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors"
              />
              {search && (
                <button
                  onClick={() => {
                    setSearch('');
                    setPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-white/40 text-xs tracking-widest uppercase mb-2">Filter by style</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleCategoryChange('')}
                className={`px-3 py-1.5 text-xs tracking-widest uppercase border transition-colors
                  ${selectedCategory === ''
                    ? 'border-brand-accent text-brand-accent'
                    : 'border-white/10 text-white/40 hover:text-white/70'}`}
              >
                All
              </button>
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryChange(cat)}
                  className={`px-3 py-1.5 text-xs tracking-widest uppercase border transition-colors
                    ${selectedCategory === cat
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-white/10 text-white/40 hover:text-white/70'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-lg aspect-square animate-pulse" />
            ))
          ) : inspirations.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="text-white/30 text-sm mb-2">No inspirations found</p>
              <p className="text-white/20 text-xs">Try adjusting your filters or search</p>
            </div>
          ) : (
            inspirations.map((insp) => (
              <InspirationCard
                key={insp._id}
                inspiration={insp}
                onViewDetails={setSelectedInspiration}
              />
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-8">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <p className="text-white/40 text-xs">
              Page {page} of {pagination.totalPages}
            </p>
            <button
              onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedInspiration && (
        <InspirationDetailModal
          inspiration={selectedInspiration}
          onClose={() => setSelectedInspiration(null)}
        />
      )}
    </div>
  );
}

export default InspirationGallery;
