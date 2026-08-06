import { useEffect } from 'react';

/**
 * Full-screen image lightbox with a download button.
 * Props:
 *   src      — image URL
 *   alt      — alt text
 *   onClose  — called when the user dismisses the lightbox
 */
function ImageLightbox({ src, alt = 'Image', onClose }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    // Prevent body scroll while open
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleDownload = async () => {
    try {
      const res  = await fetch(src);
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      // Derive a filename from the URL or fall back to 'reference-image'
      const parts = src.split('/');
      a.download  = parts[parts.length - 1]?.split('?')[0] || 'reference-image';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // If fetch is blocked by CORS, fall back to opening in a new tab
      window.open(src, '_blank');
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Toolbar */}
      <div
        className="w-full max-w-4xl flex items-center justify-between mb-3 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-white/40 text-xs tracking-widest uppercase truncate">{alt}</p>
        <div className="flex items-center gap-2">
          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-white/60 hover:text-white
                       border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10
                       transition-colors"
            title="Download image"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Download
          </button>
          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 text-white/50 hover:text-white
                       border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10
                       transition-colors"
            title="Close (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Image */}
      <div
        className="flex-1 w-full max-w-4xl flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[80vh] object-contain"
          draggable={false}
        />
      </div>

      {/* Click-outside hint */}
      <p className="mt-3 text-white/20 text-xs flex-shrink-0">Click outside to close</p>
    </div>
  );
}

export default ImageLightbox;
