const mongoose = require('mongoose');
const config = require('./env');

mongoose.set('strictQuery', true);

// Kết nối MongoDB theo uri cấu hình
const connectDB = async () => {
  await mongoose.connect(config.mongoUri);
  return mongoose.connection;
};

module.exports = { connectDB };
