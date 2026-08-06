require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');
const { initializeDefaultSchedule } = require('./modules/availability/availability.service');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Connect to MongoDB — required for auth and all data operations
  await connectDB();

  // Seed default availability schedule if collection is empty
  await initializeDefaultSchedule();

  app.listen(PORT, () => {
    console.log(`✅  His Inks API is running on http://localhost:${PORT}`);
    console.log(`🔍  Health check: http://localhost:${PORT}/api/health`);
  });
};

start();
