const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 60 },
  icon: { type: String, trim: true, default: 'basket', maxlength: 30 },
  sortOrder: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);
