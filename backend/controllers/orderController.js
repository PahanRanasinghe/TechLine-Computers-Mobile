const Order = require('../models/Order');
const Product = require('../models/Product');

// ─── GET /api/orders/my  —  customer's own purchase history ─────────────────
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ customerId: req.user._id }).sort({ saleDate: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── GET /api/orders  —  admin: all orders ────────────────────────────────────
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'firstName lastName email')
      .sort({ saleDate: -1 });
    res.json({ success: true, count: orders.length, data: orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── POST /api/orders  —  create a new order (place order from cart) ─────────
exports.createOrder = async (req, res) => {
  try {
    const { items, totalAmount, deliveryMethod, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Order must have at least one item.' });
    }

    // Deduct stock for each item
    for (const item of items) {
      if (item.productId) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { quantityInStock: -item.quantity }
        });
      }
    }

    const order = await Order.create({
      customerId:    req.user._id,
      customerName:  `${req.user.firstName} ${req.user.lastName}`.trim(),
      customerEmail: req.user.email,
      items,
      totalAmount,
      deliveryMethod: deliveryMethod || 'Store Pickup',
      paymentMethod:  paymentMethod  || 'Cash',
    });

    res.status(201).json({ success: true, message: '✅ Order placed successfully.', data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─── PATCH /api/orders/:id/status  —  admin: update order status ─────────────
exports.updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];
    if (!valid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
