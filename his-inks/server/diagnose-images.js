/**
 * Diagnostic script — inspect tattoo records in MongoDB
 * Run from server/: node diagnose-images.js
 */
require('dotenv').config();
const mongoose = require('mongoose');

async function diagnose() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('Connected.\n');

  const Tattoo = require('./src/modules/tattoos/tattoo.model');
  const tattoos = await Tattoo.find({}).limit(10).lean();

  if (tattoos.length === 0) {
    console.log('⚠️  No tattoo records found in the database.');
  } else {
    console.log(`Found ${tattoos.length} tattoo record(s):\n`);
    tattoos.forEach((t, i) => {
      const img = t.image || '<MISSING>';
      let verdict;
      if (!t.image)                                   verdict = '❌ NULL/UNDEFINED';
      else if (t.image.startsWith('https://res.cloudinary.com')) verdict = '✅ Valid Cloudinary HTTPS URL';
      else if (t.image.startsWith('http://res.cloudinary.com'))  verdict = '⚠️  Cloudinary HTTP (not https)';
      else if (t.image.startsWith('https://'))         verdict = '⚠️  Other HTTPS URL';
      else if (t.image.startsWith('/'))                verdict = '❌ Relative/local path';
      else                                             verdict = '❌ Unknown format';

      console.log(`[${i + 1}] ${t.title}`);
      console.log(`    category: ${t.category}`);
      console.log(`    image   : ${img}`);
      console.log(`    verdict : ${verdict}`);
      console.log();
    });
  }

  await mongoose.disconnect();
}

diagnose().catch(e => { console.error(e.message); process.exit(1); });
