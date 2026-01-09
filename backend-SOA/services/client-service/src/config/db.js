const mongoose = require("mongoose");

function normalizeMongoUri(uri) {
  const s = String(uri || "");
  // Windows/Node: `localhost` có thể resolve sang IPv6 (::1) trong khi Mongo chỉ listen IPv4
  // => thay bằng 127.0.0.1 để tránh ECONNREFUSED ::1:27017
  return s.replace(/^mongodb(\+srv)?:\/\/localhost\b/i, (m) => m.replace(/localhost/i, "127.0.0.1"));
}

async function connectDb(uri) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(normalizeMongoUri(uri));
  return mongoose.connection;
}

module.exports = connectDb;

