const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    tattooIdea: {
      type: String,
      required: [true, 'Tattoo idea is required'],
      trim: true,
      maxlength: [200, 'Tattoo idea cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    placement: {
      type: String,
      required: [true, 'Placement is required'],
      trim: true,
      maxlength: [100, 'Placement cannot exceed 100 characters'],
    },
    size: {
      type: String,
      required: [true, 'Size is required'],
      trim: true,
      enum: {
        values: ['Small', 'Medium', 'Large', 'Extra Large', 'Full Sleeve', 'Half Sleeve'],
        message: 'Size must be Small, Medium, Large, Extra Large, Full Sleeve, or Half Sleeve',
      },
    },
    referenceImage: {
      type: String,
      trim: true,
      default: null,
    },
    preferredDate: {
      type: Date,
      required: [true, 'Preferred date is required'],
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'confirmed', 'completed', 'cancelled'],
        message: 'Status must be pending, confirmed, completed, or cancelled',
      },
      default: 'pending',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: null,
    },
    // Optional — populated when a logged-in customer submits the form
    userId: {
      type: require('mongoose').Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
