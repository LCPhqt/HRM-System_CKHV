const mongoose = require("mongoose");

// Schema thông tin nhân viên
const employeeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    departmentId: { type: String, default: null },
    position: { type: String, default: null },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      default: null,
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    hireDate: { type: Date, default: null },
    contact: {
      phone: { type: String, default: null },
      email: { type: String, default: null },
      address: { type: String, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Employee", employeeSchema);

