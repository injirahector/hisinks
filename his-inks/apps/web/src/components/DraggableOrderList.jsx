/**
 * DraggableOrderList — reusable drag-and-drop ordering component.
 *
 * Uses @dnd-kit (already installed) which works correctly on touch devices
 * unlike the native HTML5 drag API.
 *
 * Props:
 *   items        {Array}    – ordered array of objects, each needs: _id, title, image,
 *                             category, published (optional)
 *   onDragEnd    {Function} – called with the new ordered array after a drag
 *   onSave       {Function} – called when admin clicks "Save Order"
 *   isDirty      {Boolean}  – true when unsaved changes exist
 *   loading      {Boolean}  – show skeleton while loading
 *   saving       {Boolean}  – show saving state on button
 *   getImageUrl  {Function} – resolve image src (pass the project utility)
 *   emptyMessage {string}   – text shown when items is empty
 */
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// ── Drag handle icon (6-dot grid) ────────────────────────────────────────────
function GripIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <circle cx="7"  cy="4"  r="1.4" />
      <circle cx="13" cy="4"  r="1.4" />
      <circle cx="7"  cy="10" r="1.4" />
      <circle cx="13" cy="10" r="1.4" />
      <circle cx="7"  cy="16" r="1.4" />
      <circle cx="13" cy="16" r="1.4" />
    </svg>
  );
}

// ── Published / Draft badges ──────────────────────────────────────────────────
function PublishedBadge() {
  return (
    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                     text-[10px] font-medium tracking-widest uppercase
                     bg-green-500/10 border border-green-500/25 text-green-400 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
      Live
    </span>
  );
}

function DraftBadge() {
  return (
    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full
                     text-[10px] font-medium tracking-widest uppercase
                     bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
      Draft
    </span>
  );
}

// ── Single sortable row ───────────────────────────────────────────────────────
function SortableRow({ item, index, resolveImage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    position: 'relative',
    zIndex: isDragging ? 50 : 'auto',
  };

  // Track broken images
  const handleImgError = (e) => {
    e.currentTarget.src = '';
    e.currentTarget.style.display = 'none';
    const parent = e.currentTarget.parentElement;
    if (parent) parent.setAttribute('data-broken', 'true');
  };

  const imgSrc = resolveImage ? resolveImage(item.image) : item.image;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        flex items-center gap-3 px-3 py-2.5 border rounded-lg
        transition-all duration-150 select-none
        ${isDragging
          ? 'border-brand-accent/70 bg-brand-accent/8 shadow-xl shadow-black/40 opacity-90 scale-[1.01]'
          : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
        }
      `}
    >
      {/* ── Drag handle ─────────────────────────────────────────────────── */}
      <button
        {...attributes}
        {...listeners}
        className="
          flex-shrink-0 flex items-center justify-center
          w-8 h-8 rounded
          text-white/20 hover:text-white/60
          cursor-grab active:cursor-grabbing
          touch-none
          transition-colors
        "
        aria-label={`Drag to reorder: ${item.title}`}
        tabIndex={0}
      >
        <GripIcon className="w-5 h-5" />
      </button>

      {/* ── Position badge ──────────────────────────────────────────────── */}
      <span className="flex-shrink-0 w-7 text-center text-xs font-mono text-white/30 tabular-nums">
        #{index + 1}
      </span>

      {/* ── Thumbnail ───────────────────────────────────────────────────── */}
      <div
        className="flex-shrink-0 w-11 h-11 rounded overflow-hidden bg-white/8
                   flex items-center justify-center"
        data-broken="false"
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={item.title}
            className="w-full h-full object-cover"
            draggable={false}
            onError={handleImgError}
          />
        ) : (
          /* Fallback when no image */
          <svg className="w-5 h-5 text-white/15" fill="none" stroke="currentColor"
               strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159
                 m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909
                 m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75
                 A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z" />
          </svg>
        )}
      </div>

      {/* ── Text ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-medium truncate leading-tight">
          {item.title}
        </p>
        {item.category && (
          <p className="text-white/35 text-xs truncate mt-0.5">
            {item.category}
          </p>
        )}
      </div>

      {/* ── Published status ────────────────────────────────────────────── */}
      {item.published !== undefined && (
        item.published ? <PublishedBadge /> : <DraftBadge />
      )}
    </div>
  );
}

// ── Skeleton rows while loading ───────────────────────────────────────────────
function SkeletonRows({ count = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-3 py-2.5 border border-white/8 rounded-lg animate-pulse"
        >
          <div className="w-8 h-8 rounded bg-white/8 flex-shrink-0" />
          <div className="w-7 h-3 bg-white/8 rounded flex-shrink-0" />
          <div className="w-11 h-11 rounded bg-white/8 flex-shrink-0" />
          <div className="flex-1 space-y-1.5 min-w-0">
            <div className="h-3 bg-white/10 rounded w-3/5" />
            <div className="h-2.5 bg-white/8 rounded w-2/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function DraggableOrderList({
  items = [],
  onDragEnd,
  onSave,
  isDirty = false,
  loading = false,
  saving = false,
  getImageUrl,
  emptyMessage = 'No items yet.',
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a small movement before activating so clicks still work
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item._id === active.id);
    const newIndex = items.findIndex((item) => item._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onDragEnd(arrayMove(items, oldIndex, newIndex));
  };

  // ── Loading state ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="h-3 bg-white/8 rounded w-40 animate-pulse" />
          <div className="h-8 bg-white/8 rounded w-24 animate-pulse" />
        </div>
        <SkeletonRows count={5} />
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-white/10 rounded-lg py-16 text-center">
        <svg className="w-8 h-8 mx-auto text-white/15 mb-3" fill="none" stroke="currentColor"
             strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M3.75 5.25h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5" />
        </svg>
        <p className="text-white/30 text-sm">{emptyMessage}</p>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <p className="text-white/25 text-xs flex-shrink-0">
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </p>
          {isDirty && (
            <span className="inline-flex items-center gap-1.5 text-yellow-400 text-xs flex-shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" aria-hidden="true" />
              Unsaved changes
            </span>
          )}
        </div>

        <button
          onClick={onSave}
          disabled={!isDirty || saving}
          className={`
            flex-shrink-0 px-4 py-2 text-xs tracking-widest uppercase border
            transition-colors duration-150
            ${isDirty && !saving
              ? 'border-brand-accent/50 bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20'
              : 'border-white/10 text-white/20 cursor-not-allowed'}
          `}
        >
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83
                         M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Saving…
            </span>
          ) : 'Save Order'}
        </button>
      </div>

      {/* Hint */}
      <p className="text-white/20 text-xs mb-3">
        Drag the <GripIcon className="inline w-3.5 h-3.5 align-middle text-white/30" /> handle to reorder, then click Save Order.
      </p>

      {/* Sortable list */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item._id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {items.map((item, index) => (
              <SortableRow
                key={item._id}
                item={item}
                index={index}
                resolveImage={getImageUrl}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default DraggableOrderList;
