const Tattoo = require('./tattoo.model');

// ── Sort helper ────────────────────────────────────────────────────────────────
// Records with displayOrder > 0 appear first, sorted ascending (1, 2, 3 …).
// Records with displayOrder = 0 (legacy / uninitialized) appear last, sorted by
// newest-first createdAt, preserving the pre-feature display order for old data.
//
// MongoDB aggregation: replace 0 with a large sentinel so zero-order items
// sort to the end of an ascending displayOrder sort.
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

// ── Create ────────────────────────────────────────────────────────────────────
async function createTattoo({ title, description, category, image, priceRange }) {
  // Assign the next displayOrder so new items appear at the end of the ordered list
  const maxOrderResult = await Tattoo.findOne({ displayOrder: { $gt: 0 } }, { displayOrder: 1 })
    .sort({ displayOrder: -1 })
    .lean();
  const nextOrder = (maxOrderResult?.displayOrder || 0) + 1;

  const tattoo = await Tattoo.create({
    title:        title.trim(),
    description:  description ? description.trim() : null,
    category:     category.trim(),
    image:        image.trim(),
    priceRange:   priceRange ? priceRange.trim() : null,
    displayOrder: nextOrder,
  });
  return tattoo;
}

// ── Get all ───────────────────────────────────────────────────────────────────
async function getAllTattoos({ category, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (category) filter.category = category;

  const skip = (page - 1) * limit;

  const pipeline = [
    { $match: filter },
    DISPLAY_ORDER_SORT_STAGE,
    { $sort: { _sortOrder: 1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    { $project: { _sortOrder: 0 } },
  ];

  const [tattoos, total] = await Promise.all([
    Tattoo.aggregate(pipeline),
    Tattoo.countDocuments(filter),
  ]);

  return {
    tattoos,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get one ───────────────────────────────────────────────────────────────────
async function getTattooById(id) {
  const tattoo = await Tattoo.findById(id);
  if (!tattoo) {
    const err = new Error('Tattoo not found.');
    err.statusCode = 404;
    throw err;
  }
  return tattoo;
}

// ── Update ────────────────────────────────────────────────────────────────────
async function updateTattoo(id, updates) {
  const allowed = ['title', 'description', 'category', 'image', 'priceRange'];
  const filtered = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) {
      filtered[key] = typeof updates[key] === 'string' ? updates[key].trim() : updates[key];
    }
  });

  const tattoo = await Tattoo.findByIdAndUpdate(
    id,
    { $set: filtered },
    { new: true, runValidators: true }
  );

  if (!tattoo) {
    const err = new Error('Tattoo not found.');
    err.statusCode = 404;
    throw err;
  }
  return tattoo;
}

// ── Delete ────────────────────────────────────────────────────────────────────
async function deleteTattoo(id) {
  const tattoo = await Tattoo.findByIdAndDelete(id);
  if (!tattoo) {
    const err = new Error('Tattoo not found.');
    err.statusCode = 404;
    throw err;
  }
  return tattoo;
}

// ── Reorder tattoos (admin) ───────────────────────────────────────────────────
// Accepts an ordered array of all tattoo IDs.
// Assigns displayOrder = 1-based index position.
// Validates: all IDs must exist, no duplicates allowed.
// Returns the complete reordered collection, properly sorted.
async function reorderTattoos(orderedIds) {
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
  const existingTattoos = await Tattoo.find({
    _id: { $in: validObjectIds },
  }).select('_id').lean();

  if (existingTattoos.length !== orderedIds.length) {
    const err = new Error(`Some tattoo IDs are invalid or not found. Received ${orderedIds.length}, found ${existingTattoos.length}.`);
    err.statusCode = 400;
    throw err;
  }

  // Write all updates in parallel; each gets a 1-based position
  const updatePromises = validObjectIds.map((id, index) =>
    Tattoo.findByIdAndUpdate(
      id,
      { displayOrder: index + 1 },
      { runValidators: false }
    )
  );

  await Promise.all(updatePromises);

  // Return the complete reordered collection using the same sorting as getAllTattoos
  const pipeline = [
    { $match: { _id: { $in: validObjectIds } } },
    DISPLAY_ORDER_SORT_STAGE,
    { $sort: { _sortOrder: 1, createdAt: -1 } },
    { $project: { _sortOrder: 0 } },
  ];
  
  const reorderedTattoos = await Tattoo.aggregate(pipeline);

  return { 
    success: true, 
    count: orderedIds.length,
    tattoos: reorderedTattoos 
  };
}

module.exports = {
  createTattoo,
  getAllTattoos,
  getTattooById,
  updateTattoo,
  deleteTattoo,
  reorderTattoos,
};
