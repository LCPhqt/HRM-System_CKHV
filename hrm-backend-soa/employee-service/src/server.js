const app = require('./app');
const { connectDB } = require('./config/db');
const config = require('./config/env');
const logger = require('./shared/logger');

// Điểm khởi động: nối DB rồi mở cổng HTTP
const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      logger.info(`Employee service listening on port ${config.port}`);
    });
  } catch (err) {
    logger.error('Failed to start server', err);
    process.exit(1);
  }
};

start();
