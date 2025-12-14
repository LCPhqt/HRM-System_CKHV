const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    passwordHash: { type: String, required: true },
    roles: { type: [String], default: ["employee"] },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

