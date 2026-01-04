const Customer = require("../models/Customer");

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalize(doc) {
  if (!doc) return doc;
  const id = doc._id ? String(doc._id) : doc.id;
  const { _id, ...rest } = doc;
  return { id, ...rest };
}

async function listCustomers({ search, status, ownerId, page = 1, limit = 50 } = {}) {
  const q = {};
  q.deleted = false;
  if (status) q.status = status;
  if (ownerId) q.ownerId = ownerId;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    q.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const docs = await Customer.find(q).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean();
  return docs.map(normalize);
}

async function countCustomers({ search, status, ownerId } = {}) {
  const q = {};
  q.deleted = false;
  if (status) q.status = status;
  if (ownerId) q.ownerId = ownerId;
  if (search) {
    const rx = new RegExp(escapeRegex(search), "i");
    q.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  return Customer.countDocuments(q);
}

async function statusStats({ ownerId } = {}) {
  const match = { deleted: false };
  if (ownerId) match.ownerId = ownerId;

  const raw = await Customer.aggregate([
    { $match: match },
    {
      $group: {
        _id: { $toLower: { $ifNull: ["$status", ""] } },
        count: { $sum: 1 },
      },
    },
  ]);

  const stats = { total: 0, active: 0, lead: 0, inactive: 0, other: 0 };
  for (const row of raw) {
    const key = String(row?._id || "").trim().toLowerCase();
    const c = Number(row?.count || 0);
    stats.total += c;
    if (key === "inactive" || key.includes("ngung")) stats.inactive += c;
    else if (key === "active" || key.includes("hoat dong")) stats.active += c;
    else if (key === "lead" || key.includes("tiem nang")) stats.lead += c;
    else stats.other += c;
  }
  return stats;
}

async function getCustomer(id) {
  const doc = await Customer.findById(id).lean();
  return normalize(doc);
}

async function findByName(name) {
  const doc = await Customer.findOne({ name }).lean();
  return normalize(doc);
}

async function findByNameAndOwner(name, ownerId) {
  const doc = await Customer.findOne({ name, ownerId: ownerId || "" }).lean();
  return normalize(doc);
}

async function listDeletedCustomers({ ownerId, page = 1, limit = 50 } = {}) {
  const q = { deleted: true };
  if (ownerId) q.ownerId = ownerId;

  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(200, Math.max(1, Number(limit) || 50));
  const skip = (safePage - 1) * safeLimit;

  const docs = await Customer.find(q).sort({ deletedAt: -1 }).skip(skip).limit(safeLimit).lean();
  return docs.map(normalize);
}

async function restoreCustomer(id) {
  const updated = await Customer.findByIdAndUpdate(
    id,
    { $set: { deleted: false, deletedAt: null, deletedBy: "", deletedByEmail: "" } },
    { new: true }
  ).lean();
  return normalize(updated);
}

async function createCustomer(payload) {
  const created = await Customer.create(payload);
  // Convert to lean-like object with id
  return normalize(created.toObject ? created.toObject() : created);
}

async function updateCustomer(id, payload) {
  const updated = await Customer.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
  return normalize(updated);
}

async function deleteCustomer(id) {
  const deleted = await Customer.findByIdAndUpdate(
    id,
    { $set: { deleted: true, deletedAt: new Date() } },
    { new: true }
  ).lean();
  return normalize(deleted);
}

async function importCustomers(customers = []) {
  // customers: array of normalized payloads { name, email, phone, ... }
  const errors = [];
  const skipped = [];
  const created = [];

  const seen = new Set();
  const normalized = [];

  for (const raw of customers) {
    const name = String(raw?.name || "").trim();
    const ownerId = String(raw?.ownerId || "").trim();
    const ownerName = String(raw?.ownerName || "").trim();
    if (!name) {
      errors.push({ row: raw, message: "Missing name" });
      continue;
    }

    const key = `${ownerId}::${name.toLowerCase()}`;
    if (seen.has(key)) {
      skipped.push({ name, ownerId, reason: "duplicate_in_file" });
      continue;
    }
    seen.add(key);

    normalized.push({
      name,
      email: String(raw?.email || "").trim(),
      phone: String(raw?.phone || "").trim(),
      address: String(raw?.address || "").trim(),
      industry: String(raw?.industry || "").trim(),
      ownerId,
    ownerName,
      status: raw?.status || "lead",
      tags: Array.isArray(raw?.tags) ? raw.tags : []
    });
  }

  if (normalized.length === 0) {
    return {
      createdCount: 0,
      skippedCount: skipped.length,
      errorCount: errors.length,
      skipped,
      errors,
      created
    };
  }

  // Skip duplicates already in DB by (ownerId + name)
  const ownerIds = [...new Set(normalized.map((c) => String(c.ownerId || "")))];
  const names = [...new Set(normalized.map((c) => c.name))];
  const existing = await Customer.find(
    { ownerId: { $in: ownerIds }, name: { $in: names } },
    { name: 1, ownerId: 1 }
  ).lean();
  const existingSet = new Set(
    existing.map(
      (d) => `${String(d.ownerId || "")}::${String(d.name || "").toLowerCase()}`
    )
  );

  for (const item of normalized) {
    const key = `${String(item.ownerId || "")}::${item.name.toLowerCase()}`;
    if (existingSet.has(key)) {
      skipped.push({ name: item.name, ownerId: item.ownerId, reason: "already_exists" });
      continue;
    }
    try {
      const doc = await Customer.create(item);
      created.push(normalize(doc.toObject ? doc.toObject() : doc));
      existingSet.add(key);
    } catch (err) {
      errors.push({ name: item.name, message: err?.message || "Create failed" });
    }
  }

  return {
    createdCount: created.length,
    skippedCount: skipped.length,
    errorCount: errors.length,
    skipped,
    errors,
    created
  };
}

module.exports = {
  listCustomers,
  countCustomers,
  getCustomer,
  findByName,
  findByNameAndOwner,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
  statusStats,
  listDeletedCustomers,
  restoreCustomer
};


