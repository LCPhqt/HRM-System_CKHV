const mongoose = require("mongoose");

// Kết nối MongoDB bằng mongoose, lỗi nghiêm trọng sẽ thoát tiến trình
async function connectMongo(uri) {
  try {
    await mongoose.connect(uri);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = { connectMongo };
