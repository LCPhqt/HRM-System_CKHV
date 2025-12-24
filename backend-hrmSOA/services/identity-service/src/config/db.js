const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function connectAndSeed() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hrm_identity';
  await mongoose.connect(uri);

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const existing = await User.findOne({ email: adminEmail }).lean();
  if (!existing) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await User.create({ email: adminEmail, passwordHash, role: 'admin' });
    // eslint-disable-next-line no-console
    console.log(`Seeded admin user ${adminEmail} / ${adminPassword}`);
  }
}

module.exports = { connectAndSeed };

