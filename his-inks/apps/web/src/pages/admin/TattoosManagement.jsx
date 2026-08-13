import { useEffect, useRef, useState } from 'react';
import api from '../../services/api';
import { getImageUrl } from '../../utils/imageUrl';
import DraggableOrderList from '../../components/DraggableOrderList';

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
    <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-3
                     text-sm shadow-2xl rounded
      ${type === 'success'
        ? 'bg-green-500/20 border border-green-500/40 text-green-300'
        : 'bg-red-500/20 border border-red-500/40 text-red-300'}`}>
      {msg}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">✕</button>
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
                  className="px-4 py-2 text-xs tracking-widest uppercase bg-red-600/80
                             hover:bg-red-600 text-white transition-colors">
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
  const [preview, setPreview]     = useState(initial?.image ? getImageUrl(initial.image) : '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [uploadErr, setUploadErr] = useState('');
  const fileRef                   = useRef();

  const update = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  useEffect(() => {
    if (!imageFile) return;
    const url = URL.createObjectURL(imageFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
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
    <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/70
                    overflow-y-auto py-12 px-4">
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
              <img src={preview} alt="preview"
                   className="w-full h-48 object-cover mb-3 bg-white/5" />
            )}
            <div onClick={() => fileRef.current?.click()}
                 className="border border-dashed border-white/20 hover:border-brand-accent/60
                            transition-colors flex items-center justify-center py-6
                            cursor-pointer text-white/30 text-sm">
              {uploading ? 'Uploading…' : preview ? 'Click to replace image'
                : 'Click to select image (jpg, png, webp · max 5 MB)'}
            </div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
                   style={{ position: 'absolute', width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
                   onChange={handleFile} />
            {uploadErr && <p className="text-red-400 text-xs mt-1">{uploadErr}</p>}
            {!imageFile && (
              <input type="url" value={form.image} onChange={update('image')}
                     placeholder="…or paste an image URL"
                     className="mt-2 w-full bg-white/5 border border-white/10 px-3 py-2
                                text-white/70 text-sm placeholder-white/20 focus:outline-none
                                focus:border-brand-accent/60 transition-colors" />
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">
              Title <span className="text-brand-accent">*</span>
            </label>
            <input type="text" value={form.title} onChange={update('title')} required
                   placeholder="e.g. Lotus Mandala"
                   className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white
                              text-sm placeholder-white/20 focus:outline-none
                              focus:border-brand-accent/60 transition-colors" />
          </div>

          {/* Category */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">
              Category <span className="text-brand-accent">*</span>
            </label>
            <select value={form.category} onChange={update('category')} required
                    className="w-full bg-[#0B0B0B] border border-white/10 px-4 py-2.5 text-white
                               text-sm focus:outline-none focus:border-brand-accent/60 transition-colors">
              <option value="">Select category…</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">Description</label>
            <textarea value={form.description} onChange={update('description')} rows={3}
                      placeholder="Describe the tattoo design…"
                      className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white
                                 text-sm placeholder-white/20 focus:outline-none
                                 focus:border-brand-accent/60 transition-colors resize-none" />
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-white/50 text-xs tracking-widest uppercase mb-2">Price Range</label>
            <input type="text" value={form.priceRange} onChange={update('priceRange')}
                   placeholder="e.g. KES 8,000 – 15,000"
                   className="w-full bg-white/5 border border-white/10 px-4 py-2.5 text-white
                              text-sm placeholder-white/20 focus:outline-none
                              focus:border-brand-accent/60 transition-colors" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onCancel}
                    className="flex-1 py-2.5 border border-white/10 text-white/50 text-xs
                               tracking-widest uppercase hover:text-white hover:border-white/30
                               transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={busy}
                    className="flex-1 py-2.5 bg-brand-accent text-brand-bg text-xs tracking-widest
                               uppercase font-semibold hover:opacity-90 disabled:opacity-50
                               disabled:cursor-not-allowed transition-opacity">
              {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save Tattoo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Reorder tab ───────────────────────────────────────────────────────────────
function ReorderTab({ onToast, onReorderSuccess }) {
  const [items, setItems]         = useState([]);
  const [savedOrder, setSavedOrder] = useState([]); // Track last saved state  
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);

  // Load ALL tattoos for global ordering (no pagination)
  useEffect(() => {
    setLoading(true);
    api.get('/tattoos?limit=500')
      .then((r) => {
        const tattoos = r.data.data.tattoos;
        setItems(tattoos);
        setSavedOrder(tattoos.map(item => item._id)); // Store initial saved order
      })
      .catch((e) => onToast(e.message, 'error'))
      .finally(() => setLoading(false));
  }, [onToast]);

  // Compare current order with saved order to determine if dirty
  const currentOrder = items.map(item => item._id);
  const isDirty = JSON.stringify(currentOrder) !== JSON.stringify(savedOrder);

  const handleDragEnd = (newItems) => {
    setItems(newItems);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const orderedIds = items.map((item) => item._id);
      // Tattoo reorder endpoint is at /api/tattoos/reorder (not /api/admin/…)
      // because the tattoo router is mounted at /api/tattoos in app.js
      const response = await api.patch('/tattoos/reorder', { orderedIds });
      
      // Use the backend's returned sorted collection as the single source of truth
      const backendSortedItems = response.data.data.tattoos;
      setItems(backendSortedItems);
      setSavedOrder(backendSortedItems.map(item => item._id));
      
      // Trigger refresh in ManageTab
      onReorderSuccess?.();
      
      // Show success message
      onToast('Portfolio order saved successfully. Your gallery has been updated.', 'success');
      
      // Optional: Add a brief delay then show a secondary action toast
      setTimeout(() => {
        onToast(
          <div className="flex items-center justify-between w-full">
            <span>Want to see your changes?</span>
            <button
              onClick={() => window.open('/portfolio', '_blank')}
              className="ml-3 px-3 py-1 text-xs bg-green-400/20 hover:bg-green-400/30 
                         border border-green-400/30 rounded transition-colors text-green-200"
            >
              View Portfolio
            </button>
          </div>,
          'success'
        );
      }, 2000);
      
    } catch (e) {
      // Enhanced error handling with user-friendly message  
      const errorMsg = e.response?.data?.message || e.message || 'Network error occurred';
      const userFriendlyMsg = errorMsg.includes('network') || errorMsg.includes('fetch')
        ? 'Unable to save the order due to a network issue. Please check your connection and try again.'
        : errorMsg.includes('authentication') || errorMsg.includes('401')
        ? 'Your session has expired. Please refresh the page and log in again.'
        : errorMsg.includes('authorization') || errorMsg.includes('403') 
        ? 'You do not have permission to reorder portfolio items.'
        : 'Unable to save the order. Please try again.';
      
      onToast(userFriendlyMsg, 'error');
      // Preserve the user's unsaved arrangement on failure
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-white/30 text-xs mb-5">
        Drag items to set their display order in the public Portfolio gallery.
        <br className="hidden sm:block" />
        Changes apply immediately for visitors after you save.
      </p>

      <DraggableOrderList
        items={items}
        onDragEnd={handleDragEnd}
        onSave={handleSave}
        isDirty={isDirty}
        loading={loading}
        saving={saving}
        getImageUrl={getImageUrl}
        emptyMessage="No tattoos yet. Add some from the Manage Content tab."
      />
    </div>
  );
}

// ── Manage tab (CRUD) ─────────────────────────────────────────────────────────
function ManageTab({ onToast, refreshTrigger, externalAddTrigger, onExternalAddConsumed }) {
  const [tattoos, setTattoos]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(null); // null | 'create' | { tattoo }
  const [confirm, setConfirm]   = useState(null); // null | id

  // Open the create modal when the header button triggers it
  useEffect(() => {
    if (externalAddTrigger) {
      setModal('create');
      onExternalAddConsumed?.();
    }
  }, [externalAddTrigger, onExternalAddConsumed]);

  // Filter & sort state
  const [filterCat, setFilterCat] = useState('All');
  const [sortBy, setSortBy]       = useState('order'); // default: displayOrder

  const load = () => {
    setLoading(true);
    api.get('/tattoos?limit=500')
      .then((r) => setTattoos(r.data.data.tattoos))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  // Reload when reorder succeeds
  useEffect(() => {
    if (refreshTrigger > 0) {
      load();
    }
  }, [refreshTrigger]);

  // Derived list — filter + optional client-side re-sort
  const displayed = [...tattoos]
    .filter((t) => filterCat === 'All' || t.category === filterCat)
    .sort((a, b) => {
      if (sortBy === 'order')  return (a.displayOrder || 0) - (b.displayOrder || 0);
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'az')     return a.title.localeCompare(b.title);
      if (sortBy === 'za')     return b.title.localeCompare(a.title);
      return 0;
    });

  const handleCreate = async (data) => {
    try {
      await api.post('/tattoos', data);
      onToast('Tattoo created successfully.');
      setModal(null);
      load();
    } catch (e) {
      onToast(e.message || 'Failed to create tattoo.', 'error');
    }
  };

  const handleEdit = async (data) => {
    try {
      await api.patch(`/tattoos/${modal.tattoo._id}`, data);
      onToast('Tattoo updated.');
      setModal(null);
      load();
    } catch (e) {
      onToast(e.message || 'Failed to update tattoo.', 'error');
    }
  };

  const handleDelete = async (id) => {
    setConfirm(null);
    try {
      await api.delete(`/tattoos/${id}`);
      onToast('Tattoo deleted.');
      load();
    } catch (e) {
      onToast(e.message || 'Failed to delete.', 'error');
    }
  };

  return (
    <>
      {/* Filter & Sort bar */}
      {!loading && tattoos.length > 0 && (
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap gap-2">
            {['All', ...CATEGORIES].map((cat) => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                      className={`px-3 py-1 text-xs tracking-widest uppercase border transition-colors
                        ${filterCat === cat
                          ? 'border-brand-accent text-brand-accent bg-brand-accent/10'
                          : 'border-white/10 text-white/40 hover:border-white/30 hover:text-white'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-white/25 text-xs">
              {displayed.length} {displayed.length === 1 ? 'design' : 'designs'}
              {filterCat !== 'All' && (
                <span className="ml-1">
                  in <span className="text-white/50">{filterCat}</span>
                </span>
              )}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-white/30 text-xs tracking-widest uppercase">Sort</span>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#0B0B0B] border border-white/10 text-white/60 text-xs px-3 py-1.5
                                 focus:outline-none focus:border-brand-accent/50 transition-colors">
                <option value="order">Custom order</option>
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
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
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
              <p className="text-white/30 mb-3">
                No designs in <span className="text-white/50">{filterCat}</span>.
              </p>
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
                 className="group border border-white/8 hover:border-brand-accent/30
                            transition-colors bg-white/2">
              <div className="relative aspect-square overflow-hidden bg-white/5">
                <img src={getImageUrl(t.image)} alt={t.title}
                     className="w-full h-full object-cover group-hover:scale-105
                                transition-transform duration-300"
                     onError={(e) => { e.currentTarget.style.opacity = '0.2'; }} />
                {/* Position badge */}
                {t.displayOrder > 0 && (
                  <span className="absolute top-2 left-2 bg-black/70 text-white/80 text-[10px]
                                   font-mono px-1.5 py-0.5 rounded">
                    #{t.displayOrder}
                  </span>
                )}
              </div>
              <div className="p-3">
                <p className="text-white text-sm font-medium truncate mb-0.5">{t.title}</p>
                <p className="text-white/40 text-xs mb-1">{t.category}</p>
                <p className="text-white/20 text-xs mb-3">{fmtDate(t.createdAt)}</p>
                <div className="flex gap-2">
                  <button onClick={() => setModal({ tattoo: t })}
                          className="flex-1 py-1.5 text-xs tracking-widest uppercase border
                                     border-white/10 text-white/50 hover:text-white
                                     hover:border-white/30 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => setConfirm(t._id)}
                          className="flex-1 py-1.5 text-xs tracking-widest uppercase border
                                     border-red-500/20 text-red-500/60 hover:border-red-500/50
                                     hover:text-red-400 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {modal === 'create' && (
        <TattooForm title="Add Tattoo" onSave={handleCreate} onCancel={() => setModal(null)} />
      )}
      {modal?.tattoo && (
        <TattooForm title="Edit Tattoo" initial={modal.tattoo} onSave={handleEdit}
                    onCancel={() => setModal(null)} />
      )}
      {confirm && (
        <ConfirmDialog
          message="Delete this tattoo? This action cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function TattoosManagement() {
  const [activeTab, setActiveTab]     = useState('manage');
  const [toast, setToast]             = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger refetch in ManageTab
  // Lifted so the header "Add Tattoo" button can open the modal in ManageTab
  const [openAddModal, setOpenAddModal] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  const handleReorderSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const TABS = [
    { id: 'manage', label: 'Manage Content' },
    { id: 'order',  label: 'Reorder'        },
  ];

  return (
    <div className="p-6 md:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">Admin</p>
          <h1 className="font-display text-3xl text-white">Tattoos / Portfolio</h1>
          <p className="text-white/30 text-sm mt-1">
            Manage portfolio pieces and control their display order.
          </p>
        </div>
        {activeTab === 'manage' && (
          <button onClick={() => setOpenAddModal(true)}
                  className="btn-primary text-xs py-2.5 px-5">
            + Add Tattoo
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8">
        {TABS.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-5 py-2.5 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px
                    ${activeTab === tab.id
                      ? 'border-brand-accent text-brand-accent'
                      : 'border-transparent text-white/40 hover:text-white/70'}
                  `}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'manage' && (
        <ManageTab
          onToast={showToast}
          refreshTrigger={refreshTrigger}
          externalAddTrigger={openAddModal}
          onExternalAddConsumed={() => setOpenAddModal(false)}
        />
      )}
      {activeTab === 'order' && <ReorderTab onToast={showToast} onReorderSuccess={handleReorderSuccess} />}

      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default TattoosManagement;
