const mongoose = require('mongoose');

const tattooSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'Fine Line',
          'Black & Grey',
          'Neo-Traditional',
          'Traditional',
          'Geometric',
          'Watercolor',
          'Tribal',
          'Realism',
          'Minimalist',
          'Other',
        ],
        message: 'Invalid category',
      },
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    priceRange: {
      type: String,
      trim: true,
      maxlength: [50, 'Price range cannot exceed 50 characters'],
      default: null,
      // e.g. "KES 5,000 – 10,000" or "$50 – $150"
    },
  },
  {
    timestamps: true,
  }
);

const Tattoo = mongoose.model('Tattoo', tattooSchema);

module.exports = Tattoo;
