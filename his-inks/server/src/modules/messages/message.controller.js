const messageService = require('./message.service');
const {
  notifyAdminNewDirectMessage,
  notifyCustomerDirectMessageReply,
} = require('../notifications/notification.service');

// ── GET /api/messages/my  (customer) ─────────────────────────────────────────
async function getMyThread(req, res, next) {
  try {
    const thread = await messageService.getMyThread(req.user);
    return res.status(200).json({ success: true, data: { thread } });
  } catch (err) { next(err); }
}

// ── POST /api/messages/my  (customer) ────────────────────────────────────────
async function customerSendMessage(req, res, next) {
  try {
    const { text, image } = req.body;
    if (!text?.trim() && !image) {
      return res.status(422).json({ success: false, message: 'Message text or image is required.' });
    }
    const thread = await messageService.customerSendMessage(req.user, text, image || null);

    // Notify admin of the new direct message (fire-and-forget)
    const customerName = `${req.user.firstName} ${req.user.lastName}`.trim();
    notifyAdminNewDirectMessage(customerName);

    return res.status(200).json({ success: true, data: { thread } });
  } catch (err) { next(err); }
}

// ── PATCH /api/messages/my/read  (customer) ──────────────────────────────────
async function customerMarkRead(req, res, next) {
  try {
    const thread = await messageService.customerMarkRead(req.user._id);
    return res.status(200).json({ success: true, data: { thread } });
  } catch (err) { next(err); }
}

// ── GET /api/messages  (admin) ───────────────────────────────────────────────
async function getAllThreads(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await messageService.getAllThreads({
      page:  page  ? parseInt(page,  10) : 1,
      limit: limit ? parseInt(limit, 10) : 30,
    });
    return res.status(200).json({
      success: true,
      count: result.threads.length,
      pagination: result.pagination,
      data: { threads: result.threads },
    });
  } catch (err) { next(err); }
}

// ── GET /api/messages/:id  (admin) ───────────────────────────────────────────
async function getThreadById(req, res, next) {
  try {
    const thread = await messageService.getThreadById(req.params.id);
    return res.status(200).json({ success: true, data: { thread } });
  } catch (err) { next(err); }
}

// ── POST /api/messages/:id/reply  (admin) ────────────────────────────────────
async function adminSendMessage(req, res, next) {
  try {
    const { text, image } = req.body;
    if (!text?.trim() && !image) {
      return res.status(422).json({ success: false, message: 'Message text or image is required.' });
    }
    const thread = await messageService.adminSendMessage(req.params.id, text, image || null);

    // Notify the customer of the reply (fire-and-forget)
    notifyCustomerDirectMessageReply(thread.userId);

    return res.status(200).json({ success: true, data: { thread } });
  } catch (err) { next(err); }
}

// ── PATCH /api/messages/:id/read  (admin) ────────────────────────────────────
async function adminMarkRead(req, res, next) {
  try {
    const thread = await messageService.adminMarkRead(req.params.id);
    return res.status(200).json({ success: true, data: { thread } });
  } catch (err) { next(err); }
}

// ── GET /api/messages/unread-count  (admin) ──────────────────────────────────
async function getAdminUnreadCount(req, res, next) {
  try {
    const count = await messageService.getAdminUnreadCount();
    return res.status(200).json({ success: true, data: { count } });
  } catch (err) { next(err); }
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
