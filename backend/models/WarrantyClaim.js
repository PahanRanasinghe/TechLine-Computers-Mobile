const mongoose = require('mongoose');

const WarrantyClaimSchema = new mongoose.Schema(
  {
    customerId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    customerName:     { type: String, required: true, trim: true },
    customerEmail:    { type: String, required: true, trim: true },
    productCode:      { type: String, required: true, trim: true, uppercase: true },
    productName:      { type: String, default: '', trim: true },
    issueDescription: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Resolved'],
      default: 'Pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('WarrantyClaim', WarrantyClaimSchema);
