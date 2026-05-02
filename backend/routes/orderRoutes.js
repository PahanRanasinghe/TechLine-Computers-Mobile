const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
  getMyOrders,
  getAllOrders,
  createOrder,
  updateOrderStatus,
} = require('../controllers/orderController');

// Customer routes (auth required)
router.get('/my',            protect, getMyOrders);           // GET   /api/orders/my
router.post('/',             protect, createOrder);           // POST  /api/orders

// Admin routes
router.get('/',              protect, adminOnly, getAllOrders);            // GET   /api/orders
router.patch('/:id/status',  protect, adminOnly, updateOrderStatus);      // PATCH /api/orders/:id/status

module.exports = router;
