const mongoose = require('mongoose');

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
      required: true,
    },
    coordinates: {
      type: [Number],
      required: [true, 'Market coordinates are required'],
      validate: {
        validator(value) {
          return (
            value.length === 2 &&
            value[0] >= -180 &&
            value[0] <= 180 &&
            value[1] >= -90 &&
            value[1] <= 90
          );
        },
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const marketSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Market name is required'],
      trim: true,
      maxlength: [100, 'Market name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Market address is required'],
      trim: true,
      maxlength: [250, 'Address cannot exceed 250 characters'],
    },
    location: {
      type: pointSchema,
      required: [true, 'Market location is required'],
      index: '2dsphere',
    },
    marketDays: [
      {
        type: String,
        enum: [
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
          'sunday',
        ],
      },
    ],
    openingTime: {
      type: String,
      required: [true, 'Opening time is required'],
      trim: true,
    },
    closingTime: {
      type: String,
      required: [true, 'Closing time is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: [2000, 'Market image URL cannot exceed 2000 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Market', marketSchema);

