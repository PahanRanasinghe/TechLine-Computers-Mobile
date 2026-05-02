const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  submitTicket,
  getMyTickets,
  getAllTickets,
  updateStatus,
} = require('../controllers/serviceTicketController');

// Customer routes (auth required)
router.post('/',             protect, submitTicket);    // POST  /api/service-tickets
router.get('/my',            protect, getMyTickets);    // GET   /api/service-tickets/my

// Admin routes
router.get('/',              protect, adminOnly, getAllTickets);           // GET   /api/service-tickets
router.patch('/:id/status',  protect, adminOnly, updateStatus);           // PATCH /api/service-tickets/:id/status

module.exports = router;
