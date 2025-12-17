const dotenv = require('dotenv');

// Nạp biến môi trường từ .env
dotenv.config();

const config = {
  port: process.env.PORT || 4001,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/employee_service',
  identityBaseUrl: process.env.IDENTITY_BASE_URL || 'http://localhost:4000',
  jwtPublicKey: process.env.JWT_PUBLIC_KEY || '',
};

module.exports = config;
