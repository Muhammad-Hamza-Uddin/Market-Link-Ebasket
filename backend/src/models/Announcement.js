const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    audience: { type: String, enum: ['all', 'customer', 'farmer'], default: 'all' },
    active: { type: Boolean, default: true, index: true },
    publishAt: { type: Date, default: Date.now, index: true },
    expiresAt: Date,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);