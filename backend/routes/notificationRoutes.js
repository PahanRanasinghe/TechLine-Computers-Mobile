const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getMyNotifications,
  markAsRead,
  markAllRead,
  deleteNotification,
  sendNotification,
} = require('../controllers/notificationController');

// Customer routes
router.get('/my',            protect, getMyNotifications);        // GET    /api/notifications/my
router.post('/mark-all-read',protect, markAllRead);               // POST   /api/notifications/mark-all-read
router.post('/:id/read',     protect, markAsRead);                // POST   /api/notifications/:id/read
router.delete('/:id',        protect, deleteNotification);        // DELETE /api/notifications/:id

// Admin
router.post('/send',         protect, adminOnly, sendNotification); // POST /api/notifications/send

module.exports = router;
