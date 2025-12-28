const EmployeeProfile = require('../models/EmployeeProfile');

const toDto = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: d._id.toString(),
    user_id: d.userId,
    email: d.email,
    full_name: d.fullName ?? null,
    dob: d.dob ?? null,
    phone: d.phone ?? null,
    address: d.address ?? null,
    department: d.department ?? null,
    position: d.position ?? null,
    status: d.status ?? "working",
    salary: d.salary ?? null,
    bonus: d.bonus ?? null,
    created_at: d.createdAt ?? null,
    updated_at: d.updatedAt ?? null
  };
};

async function upsertProfile(userId, email, payload) {
  const update = {};

  // Chỉ ghi đè khi payload có trường tương ứng
  if (email !== undefined) update.email = email;
  if (payload.full_name !== undefined || payload.fullName !== undefined) {
    update.fullName = payload.full_name ?? payload.fullName ?? null;
  }
  if (payload.dob !== undefined) update.dob = payload.dob ?? null;
  if (payload.phone !== undefined) update.phone = payload.phone ?? null;
  if (payload.address !== undefined) update.address = payload.address ?? null;
  if (payload.department !== undefined) update.department = payload.department ?? null;
  if (payload.position !== undefined) update.position = payload.position ?? null;
  if (payload.status !== undefined) update.status = payload.status;
  if (payload.salary !== undefined) update.salary = payload.salary ?? null;
  if (payload.bonus !== undefined) update.bonus = payload.bonus ?? null;

  const doc = await EmployeeProfile.findOneAndUpdate(
    { userId },
    { $set: update },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return toDto(doc);
}

async function getByUserId(userId) {
  const doc = await EmployeeProfile.findOne({ userId }).lean();
  return toDto(doc);
}

async function listProfiles() {
  const docs = await EmployeeProfile.find().sort({ createdAt: -1 }).lean();
  return docs.map(toDto);
}

async function getById(id) {
  const doc = await EmployeeProfile.findById(id).lean();
  return toDto(doc);
}

async function updateByUserId(userId, email, payload) {
  return upsertProfile(userId, email, payload);
}

async function deleteByUserId(userId) {
  const doc = await EmployeeProfile.findOneAndDelete({ userId }).lean();
  return toDto(doc);
}

module.exports = { upsertProfile, getByUserId, listProfiles, getById, updateByUserId, deleteByUserId };

