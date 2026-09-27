const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must contain at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must contain at least 6 characters'],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [20, 'Phone number cannot exceed 20 characters'],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    preferredMarket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
      index: true,
    },
    preferredMarkets: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Market',
    }],
    markets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Market' }],
    registrationNumber: {
      type: String,
      trim: true,
      maxlength: [40, 'Registration number cannot exceed 40 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['customer', 'farmer', 'admin'],
      default: 'customer',
    },
    accountStatus: {
      type: String,
      enum: ['active', 'pending', 'suspended'],
      default: 'active',
    },
    farmName: {
      type: String,
      trim: true,
      maxlength: [100, 'Farm name cannot exceed 100 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [2000, 'Profile image URL cannot exceed 2000 characters'],
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, 'Location cannot exceed 150 characters'],
    },
    operatingDays: [{
      type: String,
      lowercase: true,
      trim: true,
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
    }],
    pickupStartTime: { type: String, trim: true },
    pickupEndTime: { type: String, trim: true },
    orderCutoffTime: { type: String, trim: true, default: '18:00' },
    pickupSlotMinutes: { type: Number, min: 15, max: 240, default: 60 },
    coordinates: {
      latitude: { type: Number, min: -90, max: 90 },
      longitude: { type: Number, min: -180, max: 180 },
    },
    bio: { type: String, trim: true, maxlength: [1000, 'Bio cannot exceed 1000 characters'] },
    // Incrementing this number invalidates JWTs issued with an older version.
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.password;
        delete ret.tokenVersion;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
