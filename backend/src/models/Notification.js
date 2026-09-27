const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['order_placed', 'new_order', 'order_confirmed', 'order_ready', 'order_cancelled', 'farmer_registered', 'restock', 'moderation', 'announcement'],
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    relatedOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    relatedProduct: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    eventKey: { type: String, trim: true },
    read: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, eventKey: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Notification', notificationSchema);