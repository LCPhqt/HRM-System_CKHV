const AuditLog = require("../models/AuditLog");

function normalize(doc) {
  if (!doc) return doc;
  const id = doc._id ? String(doc._id) : doc.id;
  const { _id, ...rest } = doc;
  return { id, ...rest };
}

async function createLog(payload) {
  const created = await AuditLog.create(payload);
  return normalize(created.toObject ? created.toObject() : created);
}

async function listLogs({ customerId, action, actorId, from, to, page = 1, limit = 20 } = {}) {
  const q = {};
  if (customerId) q.customerId = customerId;
  if (action) q.action = action;
  if (actorId) q.actorId = actorId;
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const docs = await AuditLog.find(q).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean();
  return docs.map(normalize);
}

module.exports = {
  createLog,
  listLogs,
};

