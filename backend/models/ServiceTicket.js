const mongoose = require('mongoose');

const ServiceTicketSchema = new mongoose.Schema(
  {
    customerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName: { type: String, required: true, trim: true },
    customerEmail:{ type: String, required: true, trim: true },
    productCode:  { type: String, required: true, trim: true, uppercase: true },
    productName:  { type: String, default: '', trim: true },
    serviceType: {
      type: String,
      enum: ['Repair', 'Return', 'Replacement', 'Other'],
      default: 'Repair',
    },
    description:  { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Rejected'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ServiceTicket', ServiceTicketSchema);
