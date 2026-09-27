const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    response: { type: String, trim: true, maxlength: 1000 },
    respondedAt: Date,
    status: { type: String, enum: ['active', 'removed'], default: 'active', index: true },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
