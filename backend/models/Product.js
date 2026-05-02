const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name:            { type: String, required: true, trim: true },
    code:            { type: String, required: true, unique: true, trim: true, uppercase: true },
    category:        { type: String, required: true, trim: true },
    brand:           { type: String, default: '', trim: true },
    description:     { type: String, default: '' },
    unitPrice:       { type: Number, required: true, min: 0 },
    quantityInStock: { type: Number, default: 0, min: 0 },
    warrantyPeriod:  { type: Number, default: 0, min: 0 },
    imageUrl:        { type: String, default: '' },
    isActive:        { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Text search index
ProductSchema.index({ name: 'text', code: 'text', brand: 'text', description: 'text' });

module.exports = mongoose.model('Product', ProductSchema);
