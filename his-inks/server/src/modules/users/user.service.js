const User = require('./user.model');
const Referral = require('../referrals/referral.model');

// ── Safe projection of a populated referredBy document ───────────────────────
// referredBy is populated with deletedAt explicitly selected so we can detect
// deleted/anonymized accounts and never expose their anonymized email.
function safeReferredBy(doc) {
  if (!doc) return null;
  // doc.deletedAt may be a Date or null; treat any truthy value as deleted
  if (doc.deletedAt) {
    return { _id: doc._id, displayName: 'Deleted account', deleted: true };
  }
  const firstName = doc.firstName || '';
  const lastName  = doc.lastName  || '';
  return {
    _id:         doc._id,
    firstName,
    lastName,
    email:       doc.email || '',
    displayName: `${firstName} ${lastName}`.trim() || 'Unknown',
    deleted:     false,
  };
}

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

// ── Internal: resolve referredBy ObjectId → safe object ──────────────────────
// populate()'s select cannot override select:false on a schema field.
// We fetch the referrer directly with explicit +deletedAt to reliably detect
// deleted accounts.
async function resolveReferredBy(referredByValue) {
  // If not populated (still an ObjectId or null), nothing to do
  if (!referredByValue) return null;

  // referredByValue may be a populated Mongoose doc or a raw ObjectId
  // Extract the _id in either case
  const referrerId = referredByValue._id || referredByValue;
  if (!referrerId) return null;

  // Fetch the referrer with deletedAt explicitly selected
  const referrer = await User.findById(referrerId)
    .select('firstName lastName email +deletedAt')
    .lean();

  return safeReferredBy(referrer);
}

// ── Get user by id ─────────────────────────────────────────────────────────────
// Populates referredBy and referral counts for the admin customer drawer.
async function getUserById(userId) {
  const user = await User.findById(userId).select('+deletedAt +deletedBy +deletionReason');
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const obj = user.toSafeObject();

  // Resolve referredBy safely (handles deletedAt which select:false blocks in populate)
  obj.referredBy = await resolveReferredBy(user.referredBy);

  // Resolve deletedBy — fetch the admin who deleted this account
  if (obj.deletedBy) {
    const deletedByUser = await User.findById(obj.deletedBy)
      .select('firstName lastName email')
      .lean();
    if (deletedByUser) {
      obj.deletedByUser = {
        _id: deletedByUser._id,
        displayName: `${deletedByUser.firstName} ${deletedByUser.lastName}`.trim(),
        email: deletedByUser.email,
      };
    }
  }

  // Count how many customers this user has referred (all statuses)
  obj.referralCount = await Referral.countDocuments({ referrer: userId });

  return obj;
}

// ── Get all customers (admin) ─────────────────────────────────────────────────
async function getAllUsers({ search = '', page = 1, limit = 20, deleted } = {}) {
  const filter = { role: 'customer' };

  // deleted=true  → only deleted/anonymized accounts
  // deleted=false → only active accounts (default when not specified)
  // deleted=all   → everyone
  if (deleted === 'true') {
    filter.deletedAt = { $ne: null, $exists: true };
  } else if (deleted === 'all') {
    // no deletedAt filter — show everyone
  } else {
    // default: active accounts only (deletedAt absent or null)
    filter.$or = [{ deletedAt: null }, { deletedAt: { $exists: false } }];
  }

  if (search) {
    const re = new RegExp(search.trim(), 'i');
    const searchOr = [
      { firstName: re },
      { lastName:  re },
      { email:     re },
      { phone:     re },
    ];
    // Merge with any existing $or from the deletedAt filter
    if (filter.$or) {
      filter.$and = [{ $or: filter.$or }, { $or: searchOr }];
      delete filter.$or;
    } else {
      filter.$or = searchOr;
    }
  }

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('+deletedAt +deletedBy +deletionReason')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  // ── Resolve all referredBy ids in one batch query ─────────────────────────
  // Collect unique referrer ids from users who have referredBy set
  const referrerIds = [
    ...new Set(
      users
        .map((u) => u.referredBy?.toString())
        .filter(Boolean)
    ),
  ];

  // Fetch all referrers in one query with +deletedAt
  let referrerMap = {};
  if (referrerIds.length > 0) {
    const referrers = await User.find({ _id: { $in: referrerIds } })
      .select('firstName lastName email +deletedAt')
      .lean();
    referrers.forEach((r) => {
      referrerMap[r._id.toString()] = safeReferredBy(r);
    });
  }

  // ── Single aggregation to get referral counts for all returned users ──────
  const userIds = users.map((u) => u._id);
  const referralCounts = await Referral.aggregate([
    { $match: { referrer: { $in: userIds } } },
    { $group: { _id: '$referrer', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  referralCounts.forEach((r) => { countMap[r._id.toString()] = r.count; });

  return {
    users: users.map((u) => {
      const obj = u.toSafeObject();
      // Attach resolved referredBy (null if no referrer)
      const refId = u.referredBy?.toString();
      obj.referredBy = refId ? (referrerMap[refId] ?? null) : null;
      // Attach referral count
      obj.referralCount = countMap[u._id.toString()] ?? 0;
      return obj;
    }),
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
