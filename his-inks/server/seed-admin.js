/**
 * Temporary admin seed script — run once to create the admin user for tests.
 * Usage: node seed-admin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/his-inks';

async function seed() {
  await mongoose.connect(MONGODB_URI);

  const User = require('./src/modules/users/user.model');

  const email    = 'admin@hisinks.com';
  const password = 'Admin1234!';

  // Remove any existing admin with this email first
  await User.deleteOne({ email });

  // Let User.create trigger the pre-save bcrypt hook normally
  await User.create({
    firstName: 'Admin',
    lastName:  'HisInks',
    email,
    password,   // plain text — pre-save hook will hash it
    role:      'admin',
  });

  console.log(`Admin created: ${email} / ${password}`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error(err); process.exit(1); });
