/**
 * Admin seed script — run once to create the His Inks admin account.
 *
 * Usage (from the server/ directory):
 *   npm run create-admin
 *   — or —
 *   node create-admin.js
 *
 * Behaviour:
 *   - If the email does not exist → creates a new admin account.
 *   - If the email exists as a customer → promotes to admin (does NOT change password).
 *   - If the email already has role 'admin' → reports it and exits without changes.
 *   - Never stores a plain-text password; relies on the User model pre-save bcrypt hook.
 *   - Reads MONGODB_URI from .env (or the process environment for production/Render).
 */

// ── Load environment variables from .env ──────────────────────────────────────
require('dotenv').config();

const mongoose = require('mongoose');
const User = require('./src/modules/users/user.model');

// ── Target admin credentials ──────────────────────────────────────────────────
const ADMIN = {
  firstName: 'Hector',
  lastName:  'Admin',
  email:     'admin@hisinks.com',
  password:  'Admin@12345',   // plain text — pre-save hook will bcrypt-hash this
  role:      'admin',
  isVerified: true,
};

async function createAdmin() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('\n❌  MONGODB_URI is not set.');
    console.error('    Make sure server/.env exists and contains a valid MONGODB_URI.\n');
    process.exit(1);
  }

  console.log('\n🔌  Connecting to MongoDB…');

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
    console.log('✅  Connected.\n');

    // ── Check for existing account with this email ────────────────────────────
    const existing = await User.findOne({ email: ADMIN.email });

    if (existing) {
      console.log(`ℹ️   Found existing account for: ${ADMIN.email}`);
      console.log(`    Current role: ${existing.role}`);

      if (existing.role === 'admin') {
        console.log('\n✅  This account is already an admin. No changes made.');
        console.log('    You can log in with:');
        console.log(`    Email   : ${ADMIN.email}`);
        console.log('    Password: (whatever was set when this account was last updated)\n');
      } else {
        // Promote customer → admin without touching the password
        existing.role = 'admin';
        existing.isVerified = true;
        await existing.save({ validateModifiedOnly: true });

        console.log('\n✅  Account promoted to admin!');
        console.log('    ----------------------------------');
        console.log(`    Email      : ${ADMIN.email}`);
        console.log(`    Role       : admin`);
        console.log(`    isVerified : true`);
        console.log('    Password   : unchanged (use your existing password)');
        console.log('    ----------------------------------\n');
      }

      return;
    }

    // ── No existing account — create a fresh admin ────────────────────────────
    // Do NOT include a phone field so we avoid unique-constraint conflicts with
    // existing customer accounts that may already hold a phone number.
    const admin = new User({
      firstName: ADMIN.firstName,
      lastName:  ADMIN.lastName,
      email:     ADMIN.email,
      password:  ADMIN.password,   // bcrypt hashed by pre-save hook
      role:      ADMIN.role,
      isVerified: ADMIN.isVerified,
    });

    await admin.save();

    console.log('\n✅  Admin account created successfully!');
    console.log('    ----------------------------------');
    console.log(`    First name : ${ADMIN.firstName}`);
    console.log(`    Last name  : ${ADMIN.lastName}`);
    console.log(`    Email      : ${ADMIN.email}`);
    console.log(`    Password   : ${ADMIN.password}`);
    console.log(`    Role       : ${ADMIN.role}`);
    console.log(`    isVerified : ${ADMIN.isVerified}`);
    console.log('    ----------------------------------');
    console.log('\n    ⚠️  Save these credentials somewhere safe and do not commit them.\n');

  } catch (error) {
    console.error('\n❌  Failed to create admin:', error.message);
    if (error.code === 11000) {
      // Duplicate key — phone or email collision
      console.error('    Duplicate key conflict. Another account may share a field.');
      console.error('    Duplicate index:', error.keyValue);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌  Disconnected from MongoDB.\n');
  }
}

createAdmin();
