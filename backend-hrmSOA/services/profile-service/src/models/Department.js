const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    location: { type: String, default: "" },
    manager: { type: String, default: "" },
    staffCount: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Department", departmentSchema);
