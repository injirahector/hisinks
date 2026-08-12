const mongoose = require('mongoose');

const inspirationSchema = new mongoose.Schema(
  {
    // ── Image and content ────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
      index: true,
    },

    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: null,
    },

    // Tattoo style/category
    category: {
      type: String,
      enum: {
        values: [
          'Minimalist',
          'Fine Line',
          'Black & Grey',
          'Realism',
          'Floral',
          'Geometric',
          'Tribal',
          'Lettering',
          'Portrait',
          'Japanese',
          'Animal',
          'Traditional',
          'Abstract',
          'Sleeve',
          'Small Tattoos',
          'Custom Ideas',
        ],
        message: 'Invalid category selected',
      },
      required: [true, 'Category is required'],
      index: true,
    },

    // ── Cloudinary image storage ───────────────────────────────────────────
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },

    // Cloudinary public ID for deletion
    publicId: {
      type: String,
      required: [true, 'Cloudinary public ID is required'],
      unique: true,
      sparse: true,
    },

    // ── Optional metadata ──────────────────────────────────────────────────
    // Estimated size: Small, Medium, Large, Extra Large, Full Sleeve, Half Sleeve
    estimatedSize: {
      type: String,
      enum: {
        values: ['Small', 'Medium', 'Large', 'Extra Large', 'Full Sleeve', 'Half Sleeve'],
        message: 'Invalid estimated size',
      },
      default: null,
    },

    // Suggested placement: e.g., Arm, Leg, Chest, Back, etc.
    suggestedPlacement: {
      type: String,
      trim: true,
      maxlength: [50, 'Suggested placement cannot exceed 50 characters'],
      default: null,
    },

    // ── Publishing status ──────────────────────────────────────────────────
    published: {
      type: Boolean,
      default: false,
      index: true,
    },

    // ── Keywords for search ────────────────────────────────────────────────
    keywords: {
      type: [String],
      default: [],
      trim: true,
    },

    // ── View count (optional analytics) ────────────────────────────────────
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// ── Indexes for common queries ─────────────────────────────────────────────
inspirationSchema.index({ published: 1, createdAt: -1 });
inspirationSchema.index({ category: 1, published: 1 });
inspirationSchema.index({ title: 'text', description: 'text', keywords: 'text' });

const Inspiration = mongoose.model('Inspiration', inspirationSchema);

module.exports = Inspiration;
