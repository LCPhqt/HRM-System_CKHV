const User = require('../models/User');

const toDto = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: d._id.toString(),
    email: d.email,
    role: d.role,
    created_at: d.createdAt
  };
};

async function createUser(email, passwordHash, role) {
  const created = await User.create({ email, passwordHash, role });
  return toDto(created);
}

function findByEmail(email) {
  return User.findOne({ email }).lean();
}

async function findById(id) {
  const doc = await User.findById(id).lean();
  return toDto(doc);
}

async function listUsers() {
  const docs = await User.find({ role: 'staff' }).sort({ createdAt: -1 }).lean();
  return docs.map(toDto);
}

async function deleteUser(id) {
  const doc = await User.findByIdAndDelete(id).lean();
  return toDto(doc);
}

async function updateUser(id, payload) {
  const update = {};
  if (payload.email) update.email = payload.email;
  if (payload.role) update.role = payload.role;
  const doc = await User.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
  return toDto(doc);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers,
  deleteUser,
  updateUser
};

