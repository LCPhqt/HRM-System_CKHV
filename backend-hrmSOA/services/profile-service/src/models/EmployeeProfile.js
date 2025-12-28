const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    email: { type: String, required: true },

    fullName: String,
    dob: String,
    phone: String,
    address: String,
    department: String,
    position: String,

    //  thêm status
    status: {
      type: String,
      enum: ["working", "leave", "quit"],
      default: "working",
    },

    salary: { type: Number, default: null },
    bonus: { type: Number, default: null },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } }
);

module.exports = mongoose.model("EmployeeProfile", profileSchema);
