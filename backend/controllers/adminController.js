const User         = require('../models/User');
const Product      = require('../models/Product');
const Order        = require('../models/Order');
const WarrantyClaim= require('../models/WarrantyClaim');
const ServiceTicket= require('../models/ServiceTicket');
const Notification = require('../models/Notification');

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
exports.getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalProducts,
      lowStockProducts,
      totalOrders,
      pendingWarranty,
      pendingService,
      unreadNotifications,
    ] = await Promise.all([
      User.countDocuments({ role: 'ROLE_USER' }),
      Product.countDocuments(),
      Product.countDocuments({ quantityInStock: { $lte: 5 } }),
      Order.countDocuments(),
      WarrantyClaim.countDocuments({ status: 'Pending' }),
      ServiceTicket.countDocuments({ status: 'Pending' }),
      Notification.countDocuments({ read: false }),
    ]);

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('customerName totalAmount deliveryMethod paymentMethod createdAt status');

    // Revenue total
    const revenueAgg = await Order.aggregate([
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        lowStockProducts,
        totalOrders,
        totalRevenue,
        pendingWarranty,
        pendingService,
        unreadNotifications,
        recentOrders,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
