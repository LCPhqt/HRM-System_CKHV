const mongoose = require("mongoose");

async function connectDb(url) {
  mongoose.set("strictQuery", true);
  await mongoose.connect(url);
  // eslint-disable-next-line no-console
  console.log("✅ Department service connected to Mongo");
}

module.exports = connectDb;

