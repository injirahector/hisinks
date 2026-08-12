const Inspiration = require('./inspiration.model');

// ── Get all published inspirations (public) ────────────────────────────────────
async function getPublicInspirations({ category, search, page = 1, limit = 12 }) {
  const filter = { published: true };

  // Filter by category if provided
  if (category) {
    filter.category = category;
  }

  // Search by title, description, or keywords
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [inspirations, total] = await Promise.all([
    Inspiration.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inspiration.countDocuments(filter),
  ]);

  return {
    inspirations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get single published inspiration (public) ──────────────────────────────────
async function getPublicInspirationById(inspirationId) {
  const inspiration = await Inspiration.findById(inspirationId).lean();

  if (!inspiration) {
    const err = new Error('Inspiration not found.');
    err.statusCode = 404;
    throw err;
  }

  if (!inspiration.published) {
    const err = new Error('Inspiration not found.');
    err.statusCode = 404;
    throw err;
  }

  // Increment view count
  await Inspiration.findByIdAndUpdate(
    inspirationId,
    { $inc: { viewCount: 1 } },
    { new: false }
  );

  return inspiration;
}

// ── Get all inspirations (admin - published and unpublished) ───────────────────
async function getAllInspirations({ category, search, page = 1, limit = 20, published }) {
  const filter = {};

  // Filter by category if provided
  if (category) {
    filter.category = category;
  }

  // Filter by published status if provided
  if (published !== undefined) {
    filter.published = published;
  }

  // Search by title, description, or keywords
  if (search) {
    filter.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [inspirations, total] = await Promise.all([
    Inspiration.find(filter)
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Inspiration.countDocuments(filter),
  ]);

  return {
    inspirations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get single inspiration (admin) ─────────────────────────────────────────────
async function getInspirationById(inspirationId) {
  const inspiration = await Inspiration.findById(inspirationId).lean();

  if (!inspiration) {
    const err = new Error('Inspiration not found.');
    err.statusCode = 404;
    throw err;
  }

  return inspiration;
}

// ── Create inspiration (admin) ─────────────────────────────────────────────────
async function createInspirationAdmin(data) {
  const inspiration = await Inspiration.create({
    title: data.title.trim(),
    description: data.description ? data.description.trim() : null,
    category: data.category,
    image: data.image,
    publicId: data.publicId,
    estimatedSize: data.estimatedSize || null,
    suggestedPlacement: data.suggestedPlacement ? data.suggestedPlacement.trim() : null,
    keywords: data.keywords ? data.keywords.map((k) => k.trim()).filter(Boolean) : [],
    published: false, // Default to unpublished
  });

  return inspiration;
}

// ── Update inspiration (admin) ─────────────────────────────────────────────────
async function updateInspirationAdmin(inspirationId, updates) {
  const inspiration = await Inspiration.findById(inspirationId);

  if (!inspiration) {
    const err = new Error('Inspiration not found.');
    err.statusCode = 404;
    throw err;
  }

  // Allow updates to these fields only
  const allowed = [
    'title',
    'description',
    'category',
    'estimatedSize',
    'suggestedPlacement',
    'keywords',
  ];

  allowed.forEach((field) => {
    if (updates[field] !== undefined) {
      if (field === 'keywords' && Array.isArray(updates[field])) {
        inspiration[field] = updates[field].map((k) => k.trim()).filter(Boolean);
      } else if (typeof updates[field] === 'string') {
        inspiration[field] = updates[field].trim();
      } else {
        inspiration[field] = updates[field];
      }
    }
  });

  await inspiration.save();
  return inspiration;
}

// ── Delete inspiration (admin) ─────────────────────────────────────────────────
async function deleteInspirationAdmin(inspirationId) {
  const inspiration = await Inspiration.findByIdAndDelete(inspirationId);

  if (!inspiration) {
    const err = new Error('Inspiration not found.');
    err.statusCode = 404;
    throw err;
  }

  // TODO: Delete image from Cloudinary using publicId
  // const cloudinary = require('cloudinary').v2;
  // if (inspiration.publicId) {
  //   await cloudinary.uploader.destroy(inspiration.publicId);
  // }

  return inspiration;
}

// ── Toggle publish status (admin) ──────────────────────────────────────────────
async function togglePublishInspirationAdmin(inspirationId) {
  const inspiration = await Inspiration.findById(inspirationId);

  if (!inspiration) {
    const err = new Error('Inspiration not found.');
    err.statusCode = 404;
    throw err;
  }

  inspiration.published = !inspiration.published;
  await inspiration.save();

  return inspiration;
}

module.exports = {
  getPublicInspirations,
  getPublicInspirationById,
  getAllInspirations,
  getInspirationById,
  createInspirationAdmin,
  updateInspirationAdmin,
  deleteInspirationAdmin,
  togglePublishInspirationAdmin,
};
