import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import ImageLightbox from '../../components/ImageLightbox';
import { getSocket } from '../../services/socket';

const fmtTime = (ts) =>
  new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });

const fmtDate = (ts) =>
  ts
    ? new Date(ts).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

// ── Thread list item ──────────────────────────────────────────────────────────
function ThreadItem({ thread, selected, onClick }) {
  const unread = thread.unreadByAdmin ?? 0;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-4 border-b border-white/5 transition-colors
                  hover:bg-white/5
                  ${selected ? 'bg-white/8 border-l-2 border-l-brand-accent' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium truncate ${unread > 0 ? 'text-white' : 'text-white/60'}`}>
          {thread.customerName}
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          {unread > 0 && (
            <span className="min-w-[18px] h-4 px-1 bg-brand-accent text-black text-[10px]
                             font-bold rounded-full flex items-center justify-center">
              {unread}
            </span>
          )}
          <span className="text-white/25 text-[10px]">
            {thread.lastMessageAt ? fmtTime(thread.lastMessageAt) : '—'}
          </span>
        </div>
      </div>
      <p className="text-white/35 text-xs mt-0.5 truncate">{thread.email || thread.phone || '—'}</p>
    </button>
  );
}

// ── MessagesManagement ────────────────────────────────────────────────────────
function MessagesManagement() {
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  const [threads,       setThreads]       = useState([]);
  const [pagination,    setPagination]    = useState(null);
  const [loadingList,   setLoadingList]   = useState(true);
  const [listErr,       setListErr]       = useState('');

  const [selectedId,    setSelectedId]    = useState(null);
  const [thread,        setThread]        = useState(null);
  const [loadingThread, setLoadingThread] = useState(false);
  const [threadErr,     setThreadErr]     = useState('');

  const [text,         setText]         = useState('');
  const [sending,      setSending]      = useState(false);
  const [sendErr,      setSendErr]      = useState('');

  // Image state
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadErr,    setUploadErr]    = useState('');
  const [lightbox,     setLightbox]     = useState(null);

  // ── Load thread list ────────────────────────────────────────────────────────
  useEffect(() => {
    setLoadingList(true);
    api.get('/messages?limit=50')
      .then(res => {
        setThreads(res.data.data.threads);
        setPagination(res.data.pagination);
      })
      .catch(() => setListErr('Failed to load message threads.'))
      .finally(() => setLoadingList(false));
  }, []);

  // ── Open a thread ───────────────────────────────────────────────────────────
  const openThread = (id) => {
    if (selectedId === id) return;
    setSelectedId(id);
    setThread(null);
    setThreadErr('');
    setText('');
    setSendErr('');
    setImageFile(null);
    setImagePreview('');
    setUploadErr('');
    if (fileRef.current) fileRef.current.value = '';
    setLoadingThread(true);

    api.get(`/messages/${id}`)
      .then(res => {
        setThread(res.data.data.thread);
        api.patch(`/messages/${id}/read`).catch(() => {});
        setThreads(prev =>
          prev.map(t => t._id === id ? { ...t, unreadByAdmin: 0 } : t)
        );
      })
      .catch(() => setThreadErr('Failed to load this conversation.'))
      .finally(() => setLoadingThread(false));
  };

  // Auto-scroll when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

  // ── Socket: receive customer messages in real-time ──────────────────────
  useEffect(() => {
    const handler = ({ threadId, customerName, message, unreadByAdmin }) => {
      // 1. If this thread is currently open, append the message directly
      setThread((prev) => {
        if (!prev || prev._id !== threadId) return prev;
        // Deduplicate by _id
        if (prev.messages.some((m) => m._id === message._id)) return prev;
        // Mark as read immediately since admin has it open
        api.patch(`/messages/${threadId}/read`).catch(() => {});
        return { ...prev, messages: [...prev.messages, message], unreadByAdmin: 0 };
      });

      // 2. Update (or insert) the thread in the sidebar list
      setThreads((prev) => {
        const exists = prev.some((t) => t._id === threadId);
        if (exists) {
          return prev.map((t) => {
            if (t._id !== threadId) return t;
            // If the thread is currently open, admin already sees it — don't bump badge
            const isOpen = t._id === threadId;
            return {
              ...t,
              lastMessageAt: message.createdAt,
              unreadByAdmin: isOpen ? 0 : (t.unreadByAdmin ?? 0) + 1,
            };
          });
        }
        // New thread — add a minimal entry at the top of the list
        return [
          {
            _id: threadId,
            customerName,
            lastMessageAt: message.createdAt,
            unreadByAdmin: 1,
          },
          ...prev,
        ];
      });
    };

    // The socket may not be connected yet at render time (it's async).
    // Retry attaching for up to 3 seconds, matching NotificationContext pattern.
    const attachListener = () => {
      const socket = getSocket();
      if (!socket) return null;
      socket.on('message.created', handler);
      return () => socket.off('message.created', handler);
    };

    let cleanup = attachListener();
    let attempts = 0;
    const retryTimer = setInterval(() => {
      if (cleanup || attempts >= 6) { clearInterval(retryTimer); return; }
      cleanup = attachListener();
      attempts++;
    }, 500);

    return () => {
      clearInterval(retryTimer);
      if (cleanup) cleanup();
    };
  }, []);

  // ── File picker ─────────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr('');
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      setUploadErr('Only JPG, PNG, or WebP images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr('Image must be under 5 MB.');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
    setUploadErr('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const uploadFile = async (file) => {
    const data = new FormData();
    data.append('image', file);
    const res = await api.post('/uploads/image', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  // ── Send reply ──────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || !selectedId) return;
    setSending(true);
    setSendErr('');
    setUploadErr('');
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile);
      }
      const res = await api.post(`/messages/${selectedId}/reply`, {
        text: text.trim() || undefined,
        image: imageUrl || undefined,
      });
      setThread(res.data.data.thread);
      setText('');
      setImageFile(null);
      setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
      setThreads(prev =>
        prev.map(t =>
          t._id === selectedId
            ? { ...t, lastMessageAt: res.data.data.thread.lastMessageAt }
            : t
        )
      );
    } catch (err) {
      setSendErr(err.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const canSend = !sending && (text.trim().length > 0 || imageFile !== null);
  const messages = thread?.messages ?? [];

  return (
    <div className="h-screen flex flex-col">

      {/* Page header */}
      <div className="px-8 py-6 border-b border-white/8 flex-shrink-0">
        <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-1">Admin</p>
        <h1 className="font-display text-3xl text-white">Direct Messages</h1>
        {pagination && (
          <p className="text-white/30 text-xs mt-1">
            {pagination.total} conversation{pagination.total !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Body — two-column layout */}
      <div className="flex flex-1 min-h-0">

        {/* ── Thread list (left) ── */}
        <div className="w-72 flex-shrink-0 border-r border-white/8 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-14 bg-white/5 animate-pulse" />
                ))}
              </div>
            ) : listErr ? (
              <p className="text-red-400 text-xs p-4">{listErr}</p>
            ) : threads.length === 0 ? (
              <div className="py-16 text-center px-4">
                <p className="text-white/25 text-sm">No messages yet.</p>
                <p className="text-white/15 text-xs mt-1">Customer messages will appear here.</p>
              </div>
            ) : (
              threads.map(t => (
                <ThreadItem
                  key={t._id}
                  thread={t}
                  selected={t._id === selectedId}
                  onClick={() => openThread(t._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Conversation (right) ── */}
        <div className="flex-1 flex flex-col min-h-0">
          {!selectedId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/8
                                flex items-center justify-center mx-auto mb-4">
                  <svg className="w-7 h-7 text-white/20" fill="none" stroke="currentColor"
                    strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                  </svg>
                </div>
                <p className="text-white/25 text-sm">Select a conversation</p>
              </div>
            </div>
          ) : loadingThread ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-white/30 text-sm">Loading conversation…</p>
            </div>
          ) : threadErr ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-red-400 text-sm">{threadErr}</p>
            </div>
          ) : (
            <>
              {/* Conversation header */}
              <div className="px-6 py-4 border-b border-white/8 flex-shrink-0">
                <p className="text-white font-medium">{thread?.customerName}</p>
                <p className="text-white/35 text-xs mt-0.5">
                  {thread?.email || thread?.phone || '—'}
                  {' · '}Thread started {fmtDate(thread?.createdAt)}
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-white/25 text-sm">No messages yet.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isAdmin = msg.sender === 'admin';
                    return (
                      <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] flex flex-col gap-1 ${isAdmin ? 'items-end' : 'items-start'}`}>
                          <span className={`text-[10px] tracking-wider uppercase ${isAdmin ? 'text-brand-accent/60' : 'text-white/30'}`}>
                            {isAdmin ? 'You (Admin)' : thread?.customerName}
                          </span>

                          {/* Image attachment */}
                          {msg.image && (
                            <button
                              type="button"
                              onClick={() => setLightbox(msg.image)}
                              className={`block overflow-hidden border hover:opacity-80 transition-opacity
                                          ${isAdmin ? 'border-brand-accent/20' : 'border-white/10'}`}
                            >
                              <img
                                src={msg.image}
                                alt="Attachment"
                                className="max-w-[240px] max-h-[200px] object-cover"
                              />
                            </button>
                          )}

                          {/* Text */}
                          {msg.text && (
                            <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                              isAdmin
                                ? 'bg-brand-accent/15 border border-brand-accent/20 text-white'
                                : 'bg-white/5 border border-white/10 text-white/80'
                            }`}>
                              {msg.text}
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-white/20">{fmtTime(msg.createdAt)}</span>
                            {isAdmin && (
                              <span className={`text-[10px] ${msg.read ? 'text-green-400/50' : 'text-white/20'}`}>
                                {msg.read ? '✓ Read' : '· Delivered'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Image preview strip */}
              {imagePreview && (
                <div className="border-t border-white/8 px-4 py-3 flex items-center gap-3 flex-shrink-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-14 h-14 object-cover border border-white/10"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white
                                 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-white/40 text-xs truncate">{imageFile?.name}</p>
                </div>
              )}

              {uploadErr && (
                <p className="px-4 pb-1 text-red-400 text-xs flex-shrink-0">{uploadErr}</p>
              )}

              {/* Reply input */}
              <form onSubmit={handleSend} className="border-t border-white/8 p-3 flex items-end gap-2 flex-shrink-0">
                {/* Attach button */}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex-shrink-0 p-2.5 text-white/30 hover:text-brand-accent
                             border border-white/10 hover:border-brand-accent/30
                             transition-colors self-end mb-0.5"
                  title="Attach image"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                  </svg>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />

                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
                  }}
                  placeholder="Reply to customer… (Enter to send)"
                  rows={2}
                  className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                             placeholder-white/20 focus:outline-none focus:border-brand-accent
                             resize-none transition-colors"
                />
                <button
                  type="submit"
                  disabled={!canSend}
                  className="btn-primary px-5 py-2 text-xs self-end
                             disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {sending ? 'Sending…' : 'Reply'}
                </button>
              </form>

              {sendErr && (
                <p className="px-4 pb-3 text-red-400 text-xs flex-shrink-0">{sendErr}</p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox src={lightbox} alt="Message attachment" onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

export default MessagesManagement;
