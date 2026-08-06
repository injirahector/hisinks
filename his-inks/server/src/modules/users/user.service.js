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

// ── Get all users (admin) ─────────────────────────────────────────────────────
async function getAllUsers() {
  const users = await User.find().sort({ createdAt: -1 });
  return users.map((u) => u.toSafeObject());
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
