const Inspiration = require('./inspiration.model');

// ── Sort helper ────────────────────────────────────────────────────────────────
// Records with displayOrder > 0 appear first, sorted ascending.
// Records with displayOrder = 0 (legacy / uninitialized) appear last, sorted by
// newest-first createdAt so they fall back to the pre-feature behaviour.
//
// MongoDB aggregation trick: replace 0 with a very large sentinel value so
// zero-order items sort to the end of an ascending displayOrder sort.
const DISPLAY_ORDER_SORT_STAGE = {
  $addFields: {
    _sortOrder: {
      $cond: {
        if: { $gt: ['$displayOrder', 0] },
        then: '$displayOrder',
        else: 999999,
      },
    },
  },
};

async function _aggregateInspirations(matchStage, skip, limit, useTextScore = false) {
  const pipeline = [
    { $match: matchStage },
    DISPLAY_ORDER_SORT_STAGE,
    // When using text search score wins primary; otherwise use _sortOrder then createdAt
    ...(useTextScore
      ? [{ $sort: { score: { $meta: 'textScore' }, _sortOrder: 1, createdAt: -1 } }]
      : [{ $sort: { _sortOrder: 1, createdAt: -1 } }]),
    { $skip: skip },
    { $limit: limit },
    { $project: { _sortOrder: 0 } }, // strip the temp field from output
  ];

  const [results, totalArr] = await Promise.all([
    Inspiration.aggregate(useTextScore
      ? [{ $match: matchStage }, { $addFields: { score: { $meta: 'textScore' }, ...DISPLAY_ORDER_SORT_STAGE.$addFields } }, { $sort: { score: { $meta: 'textScore' }, _sortOrder: 1, createdAt: -1 } }, { $skip: skip }, { $limit: limit }, { $project: { _sortOrder: 0 } }]
      : pipeline
    ),
    Inspiration.countDocuments(matchStage),
  ]);

  return { items: results, total: totalArr };
}

// ── Get all published inspirations (public) ────────────────────────────────────
async function getPublicInspirations({ category, search, page = 1, limit = 12 }) {
  const filter = { published: true };
  if (category) filter.category = category;

  const skip = (page - 1) * limit;
  const useTextScore = Boolean(search);
  if (search) filter.$text = { $search: search };

  const pipeline = [
    { $match: filter },
    DISPLAY_ORDER_SORT_STAGE,
    ...(useTextScore
      ? [{ $sort: { score: { $meta: 'textScore' }, _sortOrder: 1, createdAt: -1 } }]
      : [{ $sort: { _sortOrder: 1, createdAt: -1 } }]),
    { $skip: skip },
    { $limit: limit },
    { $project: { _sortOrder: 0 } },
  ];

  const [inspirations, total] = await Promise.all([
    Inspiration.aggregate(pipeline),
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
  if (category) filter.category = category;
  if (published !== undefined) filter.published = published;

  const skip = (page - 1) * limit;
  const useTextScore = Boolean(search);
  if (search) filter.$text = { $search: search };

  const pipeline = [
    { $match: filter },
    DISPLAY_ORDER_SORT_STAGE,
    ...(useTextScore
      ? [{ $sort: { score: { $meta: 'textScore' }, _sortOrder: 1, createdAt: -1 } }]
      : [{ $sort: { _sortOrder: 1, createdAt: -1 } }]),
    { $skip: skip },
    { $limit: limit },
    { $project: { _sortOrder: 0 } },
  ];

  const [inspirations, total] = await Promise.all([
    Inspiration.aggregate(pipeline),
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
  // Assign the next displayOrder so new items appear at the end of the ordered list
  const maxOrderResult = await Inspiration.findOne({ displayOrder: { $gt: 0 } }, { displayOrder: 1 })
    .sort({ displayOrder: -1 })
    .lean();
  const nextOrder = (maxOrderResult?.displayOrder || 0) + 1;

  const inspiration = await Inspiration.create({
    title: data.title.trim(),
    description: data.description ? data.description.trim() : null,
    category: data.category,
    image: data.image,
    publicId: data.publicId,
    estimatedSize: data.estimatedSize || null,
    suggestedPlacement: data.suggestedPlacement ? data.suggestedPlacement.trim() : null,
    keywords: data.keywords ? data.keywords.map((k) => k.trim()).filter(Boolean) : [],
    published: false,
    displayOrder: nextOrder,
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

// ── Reorder inspirations (admin) ──────────────────────────────────────────────
// Accepts an ordered array of all inspiration IDs.
// Assigns displayOrder = 1-based index position.
// Validates: all IDs must exist, no duplicates allowed.
// Returns the complete reordered collection, properly sorted.
async function reorderInspirations(orderedIds) {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    const err = new Error('Invalid order data: must be a non-empty array of IDs.');
    err.statusCode = 400;
    throw err;
  }

  // Convert string IDs to ObjectId and validate format
  const mongoose = require('mongoose');
  const validObjectIds = [];
  
  for (const id of orderedIds) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      const err = new Error(`Invalid ObjectId format: ${id}`);
      err.statusCode = 400;
      throw err;
    }
    validObjectIds.push(new mongoose.Types.ObjectId(id));
  }

  // Reject duplicates
  const uniqueIds = new Set(orderedIds.map(String));
  if (uniqueIds.size !== orderedIds.length) {
    const err = new Error('Duplicate IDs found in orderedIds.');
    err.statusCode = 400;
    throw err;
  }

  // Validate that every submitted ID exists
  const existingInspirations = await Inspiration.find({
    _id: { $in: validObjectIds },
  }).select('_id').lean();

  if (existingInspirations.length !== orderedIds.length) {
    const err = new Error(`Some inspiration IDs are invalid or not found. Received ${orderedIds.length}, found ${existingInspirations.length}.`);
    err.statusCode = 400;
    throw err;
  }

  // Write all updates in parallel; each gets a 1-based position
  const updatePromises = validObjectIds.map((id, index) =>
    Inspiration.findByIdAndUpdate(
      id,
      { displayOrder: index + 1 },
      { runValidators: false }
    )
  );

  await Promise.all(updatePromises);

  // Return the complete reordered collection using the same sorting as getAllInspirations
  const pipeline = [
    { $match: { _id: { $in: validObjectIds } } },
    DISPLAY_ORDER_SORT_STAGE,
    { $sort: { _sortOrder: 1, createdAt: -1 } },
    { $project: { _sortOrder: 0 } },
  ];
  
  const reorderedInspirations = await Inspiration.aggregate(pipeline);

  return { 
    success: true, 
    count: orderedIds.length,
    inspirations: reorderedInspirations 
  };
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
  reorderInspirations,
};
