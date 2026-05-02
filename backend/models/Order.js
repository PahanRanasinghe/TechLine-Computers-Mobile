const mongoose = require('mongoose');

// ── Embedded item snapshot (prices & product info captured at time of sale) ──
const OrderItemSchema = new mongoose.Schema({
  productId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  productCode:    { type: String, required: true },
  productName:    { type: String, required: true },
  category:       { type: String,  default: '' },
  warrantyMonths: { type: Number,  default: 0 },
  quantity:       { type: Number,  required: true, min: 1 },
  unitPrice:      { type: Number,  required: true },
  subtotal:       { type: Number,  required: true },
});

const OrderSchema = new mongoose.Schema(
  {
    customerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName:  { type: String,  required: true },
    customerEmail: { type: String,  required: true },
    items:         [OrderItemSchema],
    totalAmount:   { type: Number,  required: true },
    deliveryMethod:{ type: String,  default: 'Store Pickup', enum: ['Store Pickup', 'Home Delivery'] },
    paymentMethod: { type: String,  default: 'Cash',         enum: ['Cash', 'Card', 'Bank Transfer', 'Online'] },
    status: {
      type: String,
      enum: ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'],
      default: 'Completed',
    },
    saleDate:      { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', OrderSchema);
