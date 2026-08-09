/**
 * migrate-referral-codes.js
 *
 * One-time migration script: assigns a unique referral code to every
 * existing customer who does not yet have one.
 *
 * Safe to run multiple times — skips users that already have a code.
 * Does NOT modify passwords, roles, or any other user fields.
 *
 * Usage:
 *   cd server
 *   node migrate-referral-codes.js
 *
 * Prerequisites: MONGODB_URI must be set in server/.env
 */

require('dotenv').config();
const mongoose = require('mongoose');
const crypto   = require('crypto');

// ── Minimal User model (avoids importing the full app) ────────────────────────
const userSchema = new mongoose.Schema({
  firstName:    String,
  role:         String,
  referralCode: { type: String, unique: true, sparse: true, uppercase: true },
}, { collection: 'users', timestamps: true });

const User = mongoose.model('User', userSchema);

// ── Code generator (mirrors referral.service.js) ──────────────────────────────
function generateCode(firstName) {
  const namePart = (firstName || 'HI')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .slice(0, 6);
  const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
  return (namePart + randomPart).slice(0, 8).padEnd(8, 'X');
}

async function generateUnique(existingCodes) {
  let code;
  let attempts = 0;
  do {
    code = generateCode('HI'); // fallback prefix for migration
    attempts++;
    if (attempts > 50) throw new Error('Too many collisions — aborting.');
  } while (existingCodes.has(code));
  existingCodes.add(code);
  return code;
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set. Check your server/.env file.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('Connected.\n');

  // Load all existing codes into a Set for fast collision detection
  const existing = await User.find({ referralCode: { $ne: null } }).select('referralCode').lean();
  const existingCodes = new Set(existing.map((u) => u.referralCode));
  console.log(`Existing referral codes in DB: ${existingCodes.size}`);

  // Find all customers without a referral code
  const users = await User.find({
    role:         'customer',
    referralCode: { $in: [null, undefined, ''] },
  }).select('_id firstName').lean();

  console.log(`Customers without a referral code: ${users.length}\n`);

  if (users.length === 0) {
    console.log('✅  All customers already have referral codes. Nothing to do.');
    await mongoose.disconnect();
    return;
  }

  let success = 0;
  let failed  = 0;

  for (const user of users) {
    try {
      // Generate a unique code using the user's first name for readability
      const namePart = (user.firstName || 'HI')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 6);
      const randomPart = crypto.randomBytes(2).toString('hex').toUpperCase();
      let code = (namePart + randomPart).slice(0, 8).padEnd(8, 'X');

      // Retry on collision
      let attempts = 0;
      while (existingCodes.has(code)) {
        code = await generateUnique(existingCodes);
        attempts++;
        if (attempts > 20) throw new Error('Could not generate unique code.');
      }
      existingCodes.add(code);

      await User.updateOne({ _id: user._id }, { $set: { referralCode: code } });
      console.log(`  ✓  ${user._id}  →  ${code}`);
      success++;
    } catch (err) {
      console.error(`  ✗  ${user._id}  failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nMigration complete.`);
  console.log(`  Updated: ${success}`);
  console.log(`  Failed:  ${failed}`);

  await mongoose.disconnect();
  console.log('\nDisconnected. Done.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
