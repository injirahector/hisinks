import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import ImageLightbox from '../components/ImageLightbox';
import { getSocket } from '../services/socket';

function Messages() {
  const { user, loading: authLoading } = useAuth();
  const navigate  = useNavigate();
  const bottomRef = useRef(null);
  const fileRef   = useRef(null);

  // false = loading, null = no thread yet, object = thread
  const [thread,       setThread]       = useState(false);
  const [loadErr,      setLoadErr]      = useState('');
  const [text,         setText]         = useState('');
  const [sending,      setSending]      = useState(false);
  const [sendErr,      setSendErr]      = useState('');

  // Image state
  const [imageFile,    setImageFile]    = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadErr,    setUploadErr]    = useState('');
  const [lightbox,     setLightbox]     = useState(null); // src string or null

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) navigate('/login', { state: { from: '/messages' } });
  }, [user, authLoading, navigate]);

  // Fetch existing thread on mount
  useEffect(() => {
    if (!user) return;
    api.get('/messages/my')
      .then(res => setThread(res.data.data.thread))
      .catch(() => {
        setLoadErr('Could not load your messages. Please try again.');
        setThread(null);
      });
  }, [user]);

  // Mark admin messages as read when thread opens
  useEffect(() => {
    if (thread && thread.unreadByCustomer > 0) {
      api.patch('/messages/my/read').catch(() => {});
    }
  }, [thread?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Socket: receive admin replies in real-time ───────────────────────────
  useEffect(() => {
    if (!user) return;

    const handler = ({ message }) => {
      // Only append messages sent by admin (we already have our own via REST response)
      if (message.sender !== 'admin') return;
      setThread((prev) => {
        if (!prev) return prev;
        // Deduplicate by _id
        if (prev.messages.some((m) => m._id === message._id)) return prev;
        return {
          ...prev,
          messages: [...prev.messages, message],
          unreadByCustomer: (prev.unreadByCustomer ?? 0) + 1,
        };
      });
      // Mark as read immediately since the page is open
      api.patch('/messages/my/read').catch(() => {});
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
  }, [user]);

  // Auto-scroll to bottom when messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [thread?.messages?.length]);

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

  // ── Upload helper ────────────────────────────────────────────────────────────
  const uploadFile = async (file) => {
    const data = new FormData();
    data.append('image', file);
    const res = await api.post('/uploads/image', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data.url;
  };

  // ── Send ─────────────────────────────────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;
    setSending(true);
    setSendErr('');
    setUploadErr('');
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadFile(imageFile);
      }
      const res = await api.post('/messages/my', {
        text: text.trim() || undefined,
        image: imageUrl || undefined,
      });
      setThread(res.data.data.thread);
      setText('');
      setImageFile(null);
      setImagePreview('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) {
      setSendErr(err.message || 'Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleString('en-GB', {
      day: '2-digit', month: 'short',
      hour: '2-digit', minute: '2-digit',
    });

  const canSend = !sending && (text.trim().length > 0 || imageFile !== null);

  // ── Loading ───────────────────────────────────────────────────────────────
  if (authLoading || thread === false) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <p className="text-white/30 text-sm">Loading messages…</p>
      </div>
    );
  }

  const messages = thread?.messages ?? [];

  return (
    <div className="pt-24 pb-16 min-h-screen">
      <div className="max-w-2xl mx-auto px-6">

        {/* Header */}
        <div className="mb-8">
          <p className="text-brand-accent tracking-[0.4em] uppercase text-xs mb-3">Your Account</p>
          <h1 className="font-display text-4xl text-white mb-2">Messages</h1>
          <p className="text-white/40 text-sm">
            Send a direct message to the studio. We reply within 24 hours.
          </p>
        </div>

        {loadErr && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            {loadErr}
          </div>
        )}

        {/* Chat window */}
        <div className="border border-white/8 bg-white/[0.02]">

          {/* Messages list */}
          <div className="h-[460px] overflow-y-auto px-5 py-5 space-y-4 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-brand-accent/10 border border-brand-accent/20
                                flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-brand-accent" fill="none" stroke="currentColor"
                    strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round"
                      d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm">No messages yet.</p>
                <p className="text-white/20 text-xs mt-1">
                  Send your first message and we&apos;ll get back to you.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender === 'customer';
                return (
                  <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                      <span className={`text-[10px] tracking-wider uppercase ${isMe ? 'text-white/30' : 'text-brand-accent/60'}`}>
                        {isMe ? 'You' : 'His Inks Studio'}
                      </span>

                      {/* Image attachment */}
                      {msg.image && (
                        <button
                          type="button"
                          onClick={() => setLightbox(msg.image)}
                          className={`block overflow-hidden border hover:opacity-80 transition-opacity
                                      ${isMe ? 'border-brand-accent/20' : 'border-white/10'}`}
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
                          isMe
                            ? 'bg-brand-accent/15 border border-brand-accent/20 text-white'
                            : 'bg-white/5 border border-white/10 text-white/80'
                        }`}>
                          {msg.text}
                        </div>
                      )}

                      <span className="text-[10px] text-white/20">{formatTime(msg.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>

          {/* Image preview strip */}
          {imagePreview && (
            <div className="border-t border-white/8 px-4 py-3 flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-16 h-16 object-cover border border-white/10"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white
                             rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  aria-label="Remove image"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/40 text-xs">{imageFile?.name}</p>
            </div>
          )}

          {uploadErr && (
            <p className="px-4 pb-2 text-red-400 text-xs">{uploadErr}</p>
          )}

          {/* Input row */}
          <form onSubmit={handleSend} className="border-t border-white/8 p-3 flex items-end gap-2">
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

            {/* Text input */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); }
              }}
              placeholder="Type your message… (Enter to send)"
              rows={2}
              className="flex-1 bg-white/5 border border-white/10 px-4 py-2.5 text-white text-sm
                         placeholder-white/20 focus:outline-none focus:border-brand-accent
                         resize-none transition-colors"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!canSend}
              className="btn-primary px-5 py-2 text-xs self-end
                         disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            >
              {sending ? 'Sending…' : 'Send'}
            </button>
          </form>
        </div>

        {sendErr && (
          <p className="mt-3 text-red-400 text-xs">{sendErr}</p>
        )}

        <p className="mt-5 text-white/20 text-xs text-center">
          This inbox is separate from your consultation thread.
          Replies may take up to 24 hours.
        </p>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox src={lightbox} alt="Message attachment" onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

export default Messages;
