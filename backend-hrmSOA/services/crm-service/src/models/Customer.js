const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    industry: { type: String, default: "" },
    ownerId: { type: String, default: "" },
    ownerName: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive", "lead"], default: "lead" },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Customer", customerSchema);


