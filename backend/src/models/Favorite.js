const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['product', 'farmer'], required: true },
    target: { type: mongoose.Schema.Types.ObjectId, required: true },
    restockAlert: { type: Boolean, default: false },
    lastRestockNotifiedAt: Date,
  },
  { timestamps: true }
);

favoriteSchema.index({ user: 1, targetType: 1, target: 1 }, { unique: true });

module.exports = mongoose.model('Favorite', favoriteSchema);
