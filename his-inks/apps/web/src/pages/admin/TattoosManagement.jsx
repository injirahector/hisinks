import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';

// ── Constants ─────────────────────────────────────────────────────────────────
const CATEGORIES = [
  'Fine Line', 'Black & Grey', 'Neo-Traditional', 'Traditional',
  'Geometric', 'Watercolor', 'Tribal', 'Realism', 'Minimalist', 'Other',
];

const EMPTY_FORM = { title: '', description: '', category: '', image: '', priceRange: '' };

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 text-sm shadow-xl
      ${type === 'success'
        ? 'bg-green-500/20 border border-green-500/40 text-green-300'
        : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  );
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="bg-[#141414] border border-white/10 p-6 max-w-sm w-full">
        <p className="text-white mb-6 text-sm leading-relaxed">{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel}
            className="px-4 py-2 text-xs tracking-widest uppercase text-white/50 hover:text-white
                       border border-white/10 hover:border-white/30 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="px-4 py-2 text-xs tracking-widest uppercase bg-red-600/80 hover:bg-red-600
                       text-white transition-colors">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tattoo form modal ─────────────────────────────────────────────────────────
function TattooForm({ title, initial, onSave, onCancel }) {
  const [form, setForm]           = useState(initial ? { ...initial } : { ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(initial?.image || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef                   = useRef();

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
    setUploadErr('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadErr('');
    let imageUrl = form.image;

    if (imageFile) {
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('image', imageFile);
        const res = await api.post('/uploads/tattoo-image', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageUrl = res.data.data.url;
      } catch (err) {
        setUploadErr(err.message || 'Image upload failed.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    setSaving(true);
    try {
      await onSave({ ...form, image: imageUrl });
    } finally {
      setSaving(false);
    }
  };

  const busy = uploading || saving;

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 overflow-y-auto py-12 px-4">
      <div className="bg-[#141414] border border-white/10 w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="font-display text-lg text-white">{title}</h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">
              Tattoo Image <span className="text-brand-accent">*</span>
            </label>
            {preview && (
              <img src={getImageUrl(preview)} alt="preview" className="w-full h-48 object-cover mb-3 bg-white/5" />
            )}
            <div
              onClick={() => fileRef.current?.click()}
              className="border border-dashed border-white/20 hover:border-brand-accent/60 transition-colors
                         flex items-center justify-center py-6 cursor-pointer text-white/30 text-sm">
              {uploading ? 'Uploading…' : preview ? 'Click to replace image' : 'Click to select image (jpg, png, webp · max 5 MB)'}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              className="hidden" onChange={handleFile} />
            {uploadErr && <p className="text-red-400 text-xs mt-1">{uploadErr}</p>}
            {!imageFile && (
              <input type="url" value={form.image} onChange={update('image')}
                placeholder="…or paste an image URL"
                className="mt-2 w-full bg-white/5 border border-white/10 px-3 py-2 text-white/70 text-sm
                           placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors" />
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">
              Title <span className="text-brand-accent">*</span>
            </label>
            <input type="text" value={form.title} onChange={update('title')} required
              placeholder="e.g. Lotus Mandala"
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                         placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">
              Category <span className="text-brand-accent">*</span>
            </label>
            <select value={form.category} onChange={update('category')} required
              className="w-full bg-[#0B0B0B] border border-white/10 px-4 py-2.5 text-white text-sm
                         focus:outline-none focus:border-brand-accent/60 transition-colors">
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">Description</label>
            <textarea value={form.description} onChange={update('description')} rows={3}
              placeholder="Describe the tattoo design…"
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                         placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors resize-none" />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">Price Range</label>
            <input type="text" value={form.priceRange} onChange={update('priceRange')}
              placeholder="e.g. KES 8,000 – 15,000"
              className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                         placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
              className="flex-1 py-2.5 border border-white/10 text-white/50 text-xs tracking-widest uppercase
                         hover:text-white hover:border-white/30 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy}
              className="flex-1 py-2.5 bg-brand-accent text-brand-bg text-xs tracking-widest uppercase font-semibold
                         hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
              {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save Tattoo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
function TattoosManagement() {
  const [tattoos, setTattoos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [toast, setToast]     = useState(null);
  const [modal, setModal]     = useState(null); // null | 'create' | { tattoo }
  const [confirm, setConfirm] = useState(null); // null | id string

  // ── Filter / sort state ───────────────────────────────────────────────────
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy]       = useState('newest');

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const load = () => {
    setLoading(true);
    api.get('/tattoos?limit=100')
      .then((r) => setTattoos(r.data.data.tattoos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // ── Derived list ─────────────────────────────────────────────────────────
  const displayed = [...tattoos]
    .filter((t) => filterCat === 'All' || t.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'az')     return a.title.localeCompare(b.title);
      if (sortBy === 'za')     return b.title.localeCompare(a.title);
      return 0;
    });

  const handleCreate = async (data) => {
    try {
      await api.post('/tattoos', data);
      showToast('Tattoo created successfully.');
      setModal(null);
      load();
    } catch (e) {
      showToast(e.message || 'Failed to create tattoo.', 'error');
    }
  };

  const handleEdit = async (data) => {
    try {
      await api.patch(`/tattoos/${modal.tattoo._id}`, data);
      showToast('Tattoo updated.');
      setModal(null);
      load();
    } catch (e) {
      showToast(e.message || 'Failed to update tattoo.', 'error');
    }
  };

  const handleDelete = async (id) => {
    setConfirm(null);
    try {
      await api.delete(`/tattoos/${id}`);
      showToast('Tattoo deleted.');
      load();
    } catch (e) {
      showToast(e.message || 'Failed to delete.', 'error');
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">Manage</p>
          <h1 className="font-display text-3xl text-white">Tattoos</h1>
        </div>
        <button onClick={() => setModal('create')} className="btn-primary text-xs py-2.5 px-5">
          + Add Tattoo
        </button>
      </div>

      {/* ── Filter & Sort bar ─────────────────────────────────────────────── */}
      {!loading && tattoos.length > 0 && (
        <div className="mb-6 space-y-3">
          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {['All', ...CATEGORIES].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1 text-xs tracking-widest uppercase border transition-colors duration-200
                  ${filterCat === cat
                    ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                    : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Sort + count row */}
          <div className="flex items-center justify-between">
            <p className="text-white/25 text-xs">
              {displayed.length} {displayed.length === 1 ? 'design' : 'designs'}
              {filterCat !== 'All' && <span className="ml-1">in <span className="text-white/50">{filterCat}</span></span>}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs tracking-widest uppercase">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-[#0B0B0B] border border-white/10 text-white/60 text-xs px-3 py-1.5
                           focus:outline-none focus:border-brand-accent/50 transition-colors"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="az">Title A → Z</option>
                <option value="za">Title Z → A</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white/5 animate-pulse">
              <div className="aspect-square bg-white/8" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4" />
                <div className="h-2.5 bg-white/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : displayed.length === 0 ? (
        <div className="border border-dashed border-white/10 py-24 text-center">
          {tattoos.length === 0 ? (
            <>
              <p className="text-white/30 mb-4">No tattoo designs yet.</p>
              <button onClick={() => setModal('create')} className="btn-outline text-xs py-2 px-4">
                Add your first tattoo
              </button>
            </>
          ) : (
            <>
              <p className="text-white/30 mb-3">No designs in <span className="text-white/50">{filterCat}</span>.</p>
              <button onClick={() => setFilterCat('All')} className="btn-outline text-xs py-2 px-4">
                Clear filter
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {displayed.map((t) => (
            <div key={t._id}
              className="group border border-white/8 hover:border-brand-accent/30 transition-colors bg-white/2">
              <div className="relative aspect-square overflow-hidden bg-white/5">
                <img src={getImageUrl(t.image)} alt={t.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>
              <div className="p-3">
                <p className="text-white text-sm font-medium truncate mb-0.5">{t.title}</p>
                <p className="text-white/40 text-xs mb-1">{t.category}</p>
                <p className="text-white/20 text-xs mb-3">{fmtDate(t.createdAt)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setModal({ tattoo: t })}
                    className="flex-1 py-1.5 text-xs tracking-widest uppercase border border-white/10
                               text-white/50 hover:text-white hover:border-white/30 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setConfirm(t._id)}
                    className="flex-1 py-1.5 text-xs tracking-widest uppercase border border-red-500/20
                               text-red-500/60 hover:border-red-500/50 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === 'create' && (
        <TattooForm title="Add Tattoo" onSave={handleCreate} onCancel={() => setModal(null)} />
      )}
      {modal?.tattoo && (
        <TattooForm title="Edit Tattoo" initial={modal.tattoo} onSave={handleEdit} onCancel={() => setModal(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          message="Delete this tattoo? This action cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default TattoosManagement;
