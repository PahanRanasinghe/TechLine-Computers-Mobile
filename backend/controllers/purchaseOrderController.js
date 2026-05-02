const PurchaseOrder = require('../models/PurchaseOrder');

// @desc    Get all purchase orders
// @route   GET /api/purchase-orders
// @access  Private/Admin
const getPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.find({})
      .populate('supplier', 'name email contactPerson')
      .populate('items.product', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new purchase order
// @route   POST /api/purchase-orders
// @access  Private/Admin
const createPurchaseOrder = async (req, res, next) => {
  try {
    const { supplier, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No order items provided',
      });
    }

    let totalAmount = 0;
    const orderItems = items.map(item => {
      const lineTotal = item.quantity * item.unitPrice;
      totalAmount += lineTotal;
      return {
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal,
      };
    });

    const order = await PurchaseOrder.create({
      supplier,
      items: orderItems,
      totalAmount,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update purchase order status
// @route   PUT /api/purchase-orders/:id/status
// @access  Private/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found',
      });
    }

    order.status = status;
    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchaseOrders,
  createPurchaseOrder,
  updateOrderStatus,
};
