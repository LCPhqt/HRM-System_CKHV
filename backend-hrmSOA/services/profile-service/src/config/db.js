const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_profile';
  await mongoose.connect(uri);
}

module.exports = { connect };

