const User = require('./user.model');

// ── Get current user profile ──────────────────────────────────────────────────
async function getMe(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toSafeObject();
}

// ── Get user by id ────────────────────────────────────────────────────────────
async function getUserById(userId) {
  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  return user.toSafeObject();
}

// ── Get all customers (admin) ─────────────────────────────────────────────────
async function getAllUsers({ search = '', page = 1, limit = 20 } = {}) {
  const filter = { role: 'customer' };

  if (search) {
    const re = new RegExp(search.trim(), 'i');
    filter.$or = [
      { firstName: re },
      { lastName:  re },
      { email:     re },
      { phone:     re },
    ];
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map((u) => u.toSafeObject()),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Update own profile ────────────────────────────────────────────────────────
async function updateProfile(userId, updates) {
  const allowed = ['firstName', 'lastName', 'phone', 'profileImage', 'bio', 'location'];
  const filtered = {};

  allowed.forEach((key) => {
    if (updates[key] !== undefined) filtered[key] = updates[key];
  });

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: filtered },
    { new: true, runValidators: true }
  );

  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  return user.toSafeObject();
}

module.exports = { getMe, getUserById, getAllUsers, updateProfile };
