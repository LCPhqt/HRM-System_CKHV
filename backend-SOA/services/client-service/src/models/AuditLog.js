const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    customerId: { type: String, required: true },
    action: { type: String, required: true }, // create|update|delete|status_change|owner_change|import|other
    actorId: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    success: { type: Boolean, default: true },
    before: { type: Object, default: null },
    after: { type: Object, default: null },
    meta: { type: Object, default: null }
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);

