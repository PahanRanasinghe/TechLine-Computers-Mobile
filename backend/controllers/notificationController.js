const Notification = require('../models/Notification');

// ─── GET /api/notifications/my  (auth) ───────────────────────────────────────
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const unreadCount   = notifications.filter(n => !n.read).length;
    res.json({ success: true, unreadCount, data: notifications });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/notifications/:id/read  (auth) ────────────────────────────────
exports.markAsRead = async (req, res) => {
  try {
    const n = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!n) return res.status(404).json({ success: false, message: 'Notification not found.' });
    res.json({ success: true, data: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/notifications/mark-all-read  (auth) ───────────────────────────
exports.markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── DELETE /api/notifications/:id  (auth) ───────────────────────────────────
exports.deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/notifications/send  (admin) ────────────────────────────────────
// Utility: send a notification to one or all users
exports.sendNotification = async (req, res) => {
  try {
    const { userId, message, link } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required.' });
    const n = await Notification.create({ userId, message, link: link || null });
    res.status(201).json({ success: true, data: n });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
