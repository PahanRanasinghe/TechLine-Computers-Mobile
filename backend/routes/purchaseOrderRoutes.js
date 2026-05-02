const express = require('express');
const router = express.Router();
const { getPurchaseOrders, createPurchaseOrder, updateOrderStatus } = require('../controllers/purchaseOrderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, adminOnly, getPurchaseOrders)
  .post(protect, adminOnly, createPurchaseOrder);

router.route('/:id/status')
  .put(protect, adminOnly, updateOrderStatus);

module.exports = router;
