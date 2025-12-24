const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_payroll';

async function connectDb() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(MONGO_URI);
  // eslint-disable-next-line no-console
  console.log('Payroll service connected to MongoDB');
  return mongoose.connection;
}

module.exports = connectDb;

