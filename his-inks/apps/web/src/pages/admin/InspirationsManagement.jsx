import { useCallback, useEffect, useState, useRef } from 'react';
import React from 'react';
import api from '../../services/api';
import DraggableOrderList from '../../components/DraggableOrderList';

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

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

// ── Published / Draft badges ──────────────────────────────────────────────────
function PublishedBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                     font-medium tracking-widest uppercase
                     bg-green-500/10 border border-green-500/25 text-green-400">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Published
    </span>
  );
}
function DraftBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                     font-medium tracking-widest uppercase
                     bg-yellow-500/10 border border-yellow-500/25 text-yellow-400">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Draft
    </span>
  );
}

// ── Inspiration form modal ─────────────────────────────────────────────────────
function InspirationFormModal({ inspiration, onSave, onCancel, isLoading }) {
  const [formData, setFormData] = useState(
    inspiration?._id ? {
      title: inspiration.title || '',
      description: inspiration.description || '',
      category: inspiration.category || '',
      image: inspiration.image || '',
      publicId: inspiration.publicId || '',
      estimatedSize: inspiration.estimatedSize || '',
      suggestedPlacement: inspiration.suggestedPlacement || '',
      keywords: inspiration.keywords || [],
    } : {
      title: '', description: '', category: '', image: '', publicId: '',
      estimatedSize: '', suggestedPlacement: '', keywords: [],
    }
  );
  const [errors, setErrors] = useState({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
      setErrors((p) => ({ ...p, image: 'Cloudinary not configured.' }));
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', 'hisinks_inspiration');
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: fd }
      );
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message || 'Upload failed');
      }
      const data = await res.json();
      setFormData((p) => ({ ...p, image: data.secure_url, publicId: data.public_id }));
    } catch (err) {
      setErrors((p) => ({ ...p, image: err.message || 'Failed to upload image' }));
    } finally {
      setUploadingImage(false);
    }
  };

  const categories = [
    'Minimalist', 'Fine Line', 'Black & Grey', 'Realism', 'Floral', 'Geometric',
    'Tribal', 'Lettering', 'Portrait', 'Japanese', 'Animal', 'Traditional',
    'Abstract', 'Sleeve', 'Small Tattoos', 'Custom Ideas',
  ];
  const sizes = ['Small', 'Medium', 'Large', 'Extra Large', 'Full Sleeve', 'Half Sleeve'];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
      <div className="bg-[#111] border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between px-6 py-4
                        border-b border-white/8 bg-[#111]">
          <h2 className="text-white font-display text-lg">
            {inspiration?._id ? 'Edit Inspiration' : 'Add Inspiration'}
          </h2>
          <button onClick={onCancel} className="text-white/40 hover:text-white transition-colors"
                  disabled={isLoading || uploadingImage}>✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Image */}
          <div>
            <label className="block text-white/30 text-xs tracking-widest uppercase mb-2">Image *</label>
            <div className="flex gap-3">
              <div onClick={() => fileInputRef.current?.click()}
                   className="flex-1 border-2 border-dashed border-white/20 hover:border-brand-accent/40
                              rounded-lg p-4 cursor-pointer transition-colors flex items-center justify-center">
                {formData.image ? (
                  <div className="text-center">
                    <p className="text-white/70 text-sm">Image uploaded</p>
                    <p className="text-white/40 text-xs mt-1">Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <svg className="w-6 h-6 mx-auto text-white/30 mb-2" fill="none" stroke="currentColor"
                         strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775
                           5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5H6.75z" />
                    </svg>
                    <p className="text-white/70 text-sm">Click to upload</p>
                    <p className="text-white/40 text-xs mt-1">or drag and drop</p>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*"
                     onChange={handleImageUpload} disabled={uploadingImage || isLoading}
                     className="hidden" />
              {formData.image && (
                <img src={formData.image} alt="Preview"
                     className="w-24 h-24 object-cover border border-white/10 rounded" />
              )}
            </div>
            {uploadingImage && <p className="text-brand-accent text-xs mt-1">Uploading…</p>}
            {errors.image && <p className="text-red-400 text-xs mt-1">{errors.image}</p>}
          </div>

          {/* Title */}
          <div>
            <label className="block text-white/30 text-xs tracking-widest uppercase mb-2">Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange}
                   placeholder="e.g., Minimalist Moon Tattoo" disabled={isLoading}
                   className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm
                              placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* Category */}
          <div>
            <label className="block text-white/30 text-xs tracking-widest uppercase mb-2">Category *</label>
            <select name="category" value={formData.category} onChange={handleChange} disabled={isLoading}
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm
                               focus:outline-none focus:border-brand-accent/60 transition-colors">
              <option value="">Select category…</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-white/30 text-xs tracking-widest uppercase mb-2">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows={4}
                      placeholder="Describe this inspiration…" disabled={isLoading}
                      className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm
                                 placeholder-white/20 focus:outline-none focus:border-brand-accent/60
                                 transition-colors resize-none" />
          </div>

          {/* Size */}
          <div>
            <label className="block text-white/30 text-xs tracking-widest uppercase mb-2">Estimated Size</label>
            <select name="estimatedSize" value={formData.estimatedSize || ''} onChange={handleChange}
                    disabled={isLoading}
                    className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm
                               focus:outline-none focus:border-brand-accent/60 transition-colors">
              <option value="">Select size…</option>
              {sizes.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Placement */}
          <div>
            <label className="block text-white/30 text-xs tracking-widest uppercase mb-2">
              Suggested Placement
            </label>
            <input type="text" name="suggestedPlacement" value={formData.suggestedPlacement || ''}
                   onChange={handleChange} placeholder="e.g., Arm, Leg, Chest, Back" disabled={isLoading}
                   className="w-full bg-white/5 border border-white/10 px-3 py-2 text-white text-sm
                              placeholder-white/20 focus:outline-none focus:border-brand-accent/60 transition-colors" />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onCancel} disabled={isLoading || uploadingImage}
                  className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10
                             text-white/50 hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={() => onSave(formData)}
                  disabled={isLoading || uploadingImage || !formData.image}
                  className="px-4 py-2 text-xs tracking-widest uppercase border border-brand-accent/30
                             bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20
                             transition-colors disabled:opacity-50">
            {isLoading ? 'Saving…' : 'Save'}
          </button>
        </div>
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

  // Load ALL inspirations for global ordering (no pagination)
  useEffect(() => {
    setLoading(true);
    api.get('/admin/inspirations?limit=500')
      .then((r) => {
        const inspirations = r.data.data.inspirations;
        setItems(inspirations);
        setSavedOrder(inspirations.map(item => item._id)); // Store initial saved order
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
      
      // Debug: log what we're sending
      console.log('[Reorder] Sending orderedIds:', orderedIds);
      console.log('[Reorder] Count:', orderedIds.length);
      
      const response = await api.patch('/admin/inspirations/reorder', { orderedIds });
      
      // Use the backend's returned sorted collection as the single source of truth
      const backendSortedItems = response.data.data.inspirations;
      setItems(backendSortedItems);
      setSavedOrder(backendSortedItems.map(item => item._id));
      
      // Trigger refresh in ManageTab
      onReorderSuccess?.();
      
      // Show success message
      onToast('Order saved successfully. Your gallery has been updated.', 'success');
      
      // Optional: Add a brief delay then show a secondary action toast
      setTimeout(() => {
        onToast(
          <div className="flex items-center justify-between w-full">
            <span>Want to see your changes?</span>
            <button
              onClick={() => window.open('/inspiration', '_blank')}
              className="ml-3 px-3 py-1 text-xs bg-green-400/20 hover:bg-green-400/30 
                         border border-green-400/30 rounded transition-colors text-green-200"
            >
              View Gallery
            </button>
          </div>,
          'success'
        );
      }, 2000);
      
    } catch (e) {
      // Enhanced error handling with detailed logging
      console.error('[Reorder] Error:', e);
      console.error('[Reorder] Response:', e.response?.data);
      
      const errorMsg = e.response?.data?.message || e.message || 'Network error occurred';
      const detailedError = e.response?.data?.errors 
        ? `\n${JSON.stringify(e.response.data.errors, null, 2)}`
        : '';
      
      const userFriendlyMsg = errorMsg.includes('network') || errorMsg.includes('fetch')
        ? 'Unable to save the order due to a network issue. Please check your connection and try again.'
        : errorMsg.includes('authentication') || errorMsg.includes('401')
        ? 'Your session has expired. Please refresh the page and log in again.'
        : errorMsg.includes('authorization') || errorMsg.includes('403') 
        ? 'You do not have permission to reorder inspirations.'
        : `Unable to save the order: ${errorMsg}${detailedError}`;
      
      onToast(userFriendlyMsg, 'error');
      // Preserve the user's unsaved arrangement on failure
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <p className="text-white/30 text-xs mb-5">
        Drag items to set their display order in the public Inspiration Gallery.
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
        emptyMessage="No inspirations yet. Add some from the Manage Content tab."
      />
    </div>
  );
}

// ── Manage tab (CRUD) ─────────────────────────────────────────────────────────
function ManageTab({ onToast, refreshTrigger }) {
  const [inspirations, setInspirations] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [search, setSearch]             = useState('');
  const [category, setCategory]         = useState('');
  const [page, setPage]                 = useState(1);
  const [pagination, setPagination]     = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [formModal, setFormModal]       = useState(null);
  const [isSaving, setIsSaving]         = useState(false);

  const debouncedSearch = useDebounce(search, 400);
  const LIMIT = 12;

  const categories = [
    'Minimalist', 'Fine Line', 'Black & Grey', 'Realism', 'Floral', 'Geometric',
    'Tribal', 'Lettering', 'Portrait', 'Japanese', 'Animal', 'Traditional',
    'Abstract', 'Sleeve', 'Small Tattoos', 'Custom Ideas',
  ];

  const load = useCallback((pageNum = 1, q = '', cat = '', filter = 'all') => {
    setLoading(true);
    setError('');
    const params = new URLSearchParams({ page: pageNum, limit: LIMIT });
    if (q) params.set('search', q);
    if (cat) params.set('category', cat);
    if (filter !== 'all') params.set('published', filter === 'published');

    api.get(`/admin/inspirations?${params.toString()}`)
      .then((r) => {
        setInspirations(r.data.data.inspirations);
        setPagination(r.data.pagination);
        setPage(pageNum);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(1, debouncedSearch, category, selectedFilter);
  }, [debouncedSearch, category, selectedFilter, load]);

  // Reload when reorder succeeds
  useEffect(() => {
    if (refreshTrigger > 0) {
      load(page, debouncedSearch, category, selectedFilter);
    }
  }, [refreshTrigger, page, debouncedSearch, category, selectedFilter, load]);

  const handleSaveInspiration = async (data) => {
    setIsSaving(true);
    try {
      if (formModal?._id) {
        await api.patch(`/admin/inspirations/${formModal._id}`, data);
        onToast('Inspiration updated.');
      } else {
        await api.post('/admin/inspirations', data);
        onToast('Inspiration created.');
      }
      setFormModal(null);
      load(page, debouncedSearch, category, selectedFilter);
    } catch (err) {
      setError(err.message);
      onToast(err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await api.patch(`/admin/inspirations/${id}/publish`);
      load(page, debouncedSearch, category, selectedFilter);
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this inspiration? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/inspirations/${id}`);
      onToast('Inspiration deleted.');
      load(page, debouncedSearch, category, selectedFilter);
    } catch (err) {
      onToast(err.message, 'error');
    }
  };

  return (
    <>
      {/* Filters row */}
      <div className="mb-6 flex gap-3 items-center flex-wrap">
        <div className="flex gap-1 border-r border-white/10 pr-3">
          {['all', 'published', 'draft'].map((f) => (
            <button key={f} onClick={() => setSelectedFilter(f)}
                    className={`px-3 py-1.5 text-xs tracking-widest uppercase border transition-colors
                      ${selectedFilter === f
                        ? 'border-brand-accent text-brand-accent'
                        : 'border-white/10 text-white/40 hover:text-white/70'}`}>
              {f}
            </button>
          ))}
        </div>

        <select value={category} onChange={(e) => setCategory(e.target.value)}
                className="bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-white
                           focus:outline-none focus:border-brand-accent/60">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <button onClick={() => setFormModal({})}
                className="ml-auto px-4 py-1.5 text-xs tracking-widest uppercase border
                           border-brand-accent/30 bg-brand-accent/10 text-brand-accent
                           hover:bg-brand-accent/20 transition-colors">
          + Add Inspiration
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-sm">
        <div className="relative">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                 placeholder="Search…"
                 className="w-full bg-white/5 border border-white/10 pl-3 pr-8 py-2.5 text-white
                            text-sm placeholder-white/20 focus:outline-none
                            focus:border-brand-accent/60 transition-colors" />
          {search && (
            <button onClick={() => setSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white/5 border border-white/10 rounded-lg h-64 animate-pulse" />
          ))
        ) : inspirations.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <p className="text-white/30 text-sm">No inspirations found.</p>
          </div>
        ) : (
          inspirations.map((insp) => (
            <div key={insp._id}
                 className="bg-white/5 border border-white/10 rounded-lg overflow-hidden
                            hover:border-brand-accent/30 transition-colors">
              <div className="relative aspect-square bg-white/5 overflow-hidden">
                <img src={insp.image} alt={insp.title}
                     className="w-full h-full object-cover hover:scale-105 transition-transform"
                     onError={(e) => { e.currentTarget.style.opacity = '0.2'; }} />
                {/* Position badge */}
                {insp.displayOrder > 0 && (
                  <span className="absolute top-2 left-2 bg-black/70 text-white/80 text-[10px]
                                   font-mono px-1.5 py-0.5 rounded">
                    #{insp.displayOrder}
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 justify-between">
                  <h3 className="text-white font-medium text-sm truncate">{insp.title}</h3>
                  {insp.published ? <PublishedBadge /> : <DraftBadge />}
                </div>
                <p className="text-white/40 text-xs">{insp.category}</p>
                <div className="flex gap-2 pt-2">
                  <button onClick={() => setFormModal(insp)}
                          className="flex-1 px-2 py-1.5 text-xs border border-white/10
                                     text-white/50 hover:text-white hover:border-white/30 transition-colors">
                    Edit
                  </button>
                  <button onClick={() => handleTogglePublish(insp._id)}
                          className="flex-1 px-2 py-1.5 text-xs border border-brand-accent/30
                                     text-brand-accent/70 hover:text-brand-accent transition-colors">
                    {insp.published ? 'Unpublish' : 'Publish'}
                  </button>
                  <button onClick={() => handleDelete(insp._id)}
                          className="flex-1 px-2 py-1.5 text-xs border border-red-500/30
                                     text-red-400/70 hover:text-red-400 transition-colors">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-white/25 text-xs">Page {page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => load(page - 1, debouncedSearch, category, selectedFilter)}
                    disabled={page <= 1}
                    className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10
                               text-white/50 hover:text-white transition-colors disabled:opacity-30">
              ← Prev
            </button>
            <button onClick={() => load(page + 1, debouncedSearch, category, selectedFilter)}
                    disabled={page >= pagination.totalPages}
                    className="px-4 py-2 text-xs tracking-widest uppercase border border-white/10
                               text-white/50 hover:text-white transition-colors disabled:opacity-30">
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Form modal */}
      {formModal !== null && (
        <InspirationFormModal
          inspiration={formModal}
          onSave={handleSaveInspiration}
          onCancel={() => setFormModal(null)}
          isLoading={isSaving}
        />
      )}
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
function InspirationsManagement() {
  const [activeTab, setActiveTab] = useState('manage');
  const [toast, setToast]         = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Trigger refetch in ManageTab

  const showToast = (msg, type = 'success') => setToast({ msg, type });

  // Callback for when reorder succeeds - triggers refresh of ManageTab
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
      <div className="mb-8">
        <p className="text-brand-accent tracking-[0.3em] uppercase text-xs mb-1">Admin</p>
        <h1 className="font-display text-3xl text-white">Inspiration Gallery</h1>
        <p className="text-white/30 text-sm mt-1">
          Manage inspiration images and control their display order.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-5 py-2.5 text-xs tracking-widest uppercase transition-colors border-b-2 -mb-px
              ${activeTab === tab.id
                ? 'border-brand-accent text-brand-accent'
                : 'border-transparent text-white/40 hover:text-white/70'}
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'manage' && <ManageTab onToast={showToast} refreshTrigger={refreshTrigger} />}
      {activeTab === 'order'  && <ReorderTab onToast={showToast} onReorderSuccess={handleReorderSuccess} />}

      {/* Toast */}
      {toast && (
        <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  );
}

export default InspirationsManagement;
