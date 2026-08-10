const MessageThread = require('./message.model');
const { emitToUser, emitToAdmins } = require('../../socket/socket');

// ── Helpers ───────────────────────────────────────────────────────────────────
function notFound(msg) {
  const e = new Error(msg);
  e.statusCode = 404;
  return e;
}

// ── Get or create a thread for a customer ────────────────────────────────────
async function getOrCreateThread(user) {
  let thread = await MessageThread.findOne({ userId: user._id });
  if (!thread) {
    thread = await MessageThread.create({
      userId:       user._id,
      customerName: `${user.firstName} ${user.lastName}`.trim(),
      phone:        user.phone  || '',
      email:        user.email  || null,
      messages:     [],
    });
  }
  return thread;
}

// ── Customer: get own thread ──────────────────────────────────────────────────
async function getMyThread(user) {
  const thread = await MessageThread.findOne({ userId: user._id });
  return thread; // null if no messages yet — that's fine
}

// ── Customer: send a message ──────────────────────────────────────────────────
async function customerSendMessage(user, text, image = null) {
  const thread = await getOrCreateThread(user);

  thread.messages.push({ sender: 'customer', text: text || null, image: image || null, read: false });
  thread.unreadByAdmin += 1;
  thread.lastMessageAt  = new Date();

  await thread.save();

  // Real-time: push the new message to all connected admins
  const lastMsg = thread.messages[thread.messages.length - 1];
  emitToAdmins('message.created', {
    threadId:     thread._id,
    userId:       thread.userId,
    customerName: thread.customerName,
    message: {
      _id:       lastMsg._id,
      sender:    lastMsg.sender,
      text:      lastMsg.text,
      image:     lastMsg.image,
      createdAt: lastMsg.createdAt,
    },
    unreadByAdmin: thread.unreadByAdmin,
  });

  return thread;
}

// ── Customer: mark admin messages as read ────────────────────────────────────
async function customerMarkRead(userId) {
  const thread = await MessageThread.findOne({ userId });
  if (!thread) return null;

  thread.messages.forEach((m) => {
    if (m.sender === 'admin' && !m.read) m.read = true;
  });
  thread.unreadByCustomer = 0;
  await thread.save();
  return thread;
}

// ── Admin: get all threads (paginated, newest last-message first) ─────────────
async function getAllThreads({ page = 1, limit = 30 } = {}) {
  const skip = (page - 1) * limit;

  const [threads, total] = await Promise.all([
    MessageThread.find()
      .sort({ lastMessageAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-messages'), // exclude full message array for list view
    MessageThread.countDocuments(),
  ]);

  return {
    threads,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Admin: get one thread by id (full messages) ───────────────────────────────
async function getThreadById(threadId) {
  const thread = await MessageThread.findById(threadId);
  if (!thread) throw notFound('Message thread not found.');
  return thread;
}

// ── Admin: send a message ─────────────────────────────────────────────────────
async function adminSendMessage(threadId, text, image = null) {
  const thread = await MessageThread.findById(threadId);
  if (!thread) throw notFound('Message thread not found.');

  thread.messages.push({ sender: 'admin', text: text || null, image: image || null, read: false });
  thread.unreadByCustomer += 1;
  thread.lastMessageAt     = new Date();

  await thread.save();

  // Real-time: push the new message to the customer who owns this thread
  const lastMsg = thread.messages[thread.messages.length - 1];
  emitToUser(thread.userId, 'message.created', {
    threadId: thread._id,
    message: {
      _id:       lastMsg._id,
      sender:    lastMsg.sender,
      text:      lastMsg.text,
      image:     lastMsg.image,
      createdAt: lastMsg.createdAt,
    },
    unreadByCustomer: thread.unreadByCustomer,
  });

  return thread;
}

// ── Admin: mark customer messages as read ────────────────────────────────────
async function adminMarkRead(threadId) {
  const thread = await MessageThread.findById(threadId);
  if (!thread) throw notFound('Message thread not found.');

  thread.messages.forEach((m) => {
    if (m.sender === 'customer' && !m.read) m.read = true;
  });
  thread.unreadByAdmin = 0;
  await thread.save();
  return thread;
}

// ── Admin: total unread count (messages from customers) ──────────────────────
async function getAdminUnreadCount() {
  const result = await MessageThread.aggregate([
    { $group: { _id: null, total: { $sum: '$unreadByAdmin' } } },
  ]);
  return result[0]?.total ?? 0;
}

module.exports = {
  getMyThread,
  customerSendMessage,
  customerMarkRead,
  getAllThreads,
  getThreadById,
  adminSendMessage,
  adminMarkRead,
  getAdminUnreadCount,
};
