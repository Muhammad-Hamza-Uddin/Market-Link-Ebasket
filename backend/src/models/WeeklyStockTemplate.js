const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    defaultQuantity: { type: Number, required: true, min: 0 },
    defaultPrice: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, enum: ['kg', 'gram', 'piece', 'dozen', 'bunch', 'box', 'litre'] },
    active: { type: Boolean, default: true },
  },
  { _id: true }
);

const weeklyStockTemplateSchema = new mongoose.Schema(
  {
    farmer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    market: { type: mongoose.Schema.Types.ObjectId, ref: 'Market', required: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    enabled: { type: Boolean, default: true },
    dayOfWeek: {
      type: String,
      required: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    },
    entries: {
      type: [entrySchema],
      validate: { validator: (value) => value.length > 0, message: 'A template requires at least one entry' },
    },
    overrides: [{
      date: { type: Date, required: true },
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
      quantity: { type: Number, required: true, min: 0 },
      price: { type: Number, min: 0 },
    }],
  },
  { timestamps: true }
);

weeklyStockTemplateSchema.index({ farmer: 1, market: 1, dayOfWeek: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('WeeklyStockTemplate', weeklyStockTemplateSchema);