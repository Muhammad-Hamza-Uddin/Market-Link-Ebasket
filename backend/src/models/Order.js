const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unit: {
      type: String,
      required: true,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    market: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: 'An order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    pickupDate: {
      type: Date,
      required: [true, 'Pickup date is required'],
    },
    pickupSlot: {
      type: String,
      trim: true,
      maxlength: [100, 'Pickup slot cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'ready', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    cancelledBy: {
      type: String,
      enum: ['customer', 'farmer', 'admin'],
    },
    cancellationReason: { type: String, trim: true, maxlength: 300 },
    stockRestoredAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

