const Tattoo = require('./tattoo.model');

// ── Create ────────────────────────────────────────────────────────────────────
async function createTattoo({ title, description, category, image, priceRange }) {
  const tattoo = await Tattoo.create({
    title:       title.trim(),
    description: description ? description.trim() : null,
    category:    category.trim(),
    image:       image.trim(),
    priceRange:  priceRange ? priceRange.trim() : null,
  });
  return tattoo;
}

// ── Get all ───────────────────────────────────────────────────────────────────
async function getAllTattoos({ category, page = 1, limit = 20 } = {}) {
  const filter = {};
  if (category) filter.category = category;

  const skip = (page - 1) * limit;

  const [tattoos, total] = await Promise.all([
    Tattoo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

module.exports = { createTattoo, getAllTattoos, getTattooById, updateTattoo, deleteTattoo };
