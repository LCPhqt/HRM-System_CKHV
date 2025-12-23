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
    created_at: d.createdAt ?? null,
    updated_at: d.updatedAt ?? null
  };
};

async function upsertProfile(userId, email, payload) {
  const update = {
    email,
    fullName: payload.full_name ?? payload.fullName ?? null,
    dob: payload.dob ?? null,
    phone: payload.phone ?? null,
    address: payload.address ?? null,
    department: payload.department ?? null,
    position: payload.position ?? null
  };
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

