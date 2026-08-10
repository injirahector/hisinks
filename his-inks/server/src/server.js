require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/database');
const { initializeDefaultSchedule } = require('./modules/availability/availability.service');
const { initSocket } = require('./socket/socket');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Connect to MongoDB — required for auth and all data operations
  await connectDB();

  // Seed default availability schedule if collection is empty
  await initializeDefaultSchedule();

  // Wrap Express app in a plain HTTP server so Socket.IO can share it
  const httpServer = http.createServer(app);

  // Attach Socket.IO to the HTTP server
  initSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`✅  His Inks API is running on http://localhost:${PORT}`);
    console.log(`🔍  Health check: http://localhost:${PORT}/api/health`);
    console.log(`🔌  Socket.IO is listening on port ${PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
