const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌  MONGODB_URI is not defined in environment variables.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri, {
      // Mongoose 8 sets these by default, but being explicit is safe
      serverSelectionTimeoutMS: 5000, // fail fast if MongoDB isn't reachable
    });

    const { host, port, name } = conn.connection;
    console.log(`✅  MongoDB connected successfully`);
    console.log(`    Host     : ${host}:${port}`);
    console.log(`    Database : ${name}`);
  } catch (error) {
    console.error('❌  MongoDB connection failed:', error.message);

    if (error.name === 'MongoServerSelectionError') {
      console.error('    ↳  Make sure MongoDB is running on the configured host.');
      console.error(`    ↳  URI: ${uri}`);
    }

    process.exit(1);
  }
};

// ── Connection event listeners (post-connect monitoring) ─────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️   MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅  MongoDB reconnected.');
});

module.exports = connectDB;
