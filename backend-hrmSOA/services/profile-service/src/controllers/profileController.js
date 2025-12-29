const repo = require('../repositories/profileRepo');

async function getMyProfile(req, res) {
  const profile = await repo.getByUserId(req.user.id);
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  return res.json(profile);
}

async function updateMyProfile(req, res) {
  const body = req.body || {};
  // Ưu tiên email từ payload nếu có, fallback email từ token
  const emailToSave = body.email ?? req.user.email;
  const updated = await repo.upsertProfile(req.user.id, emailToSave, body);
  return res.json(updated);
}

// ✅ ADMIN: danh sách đầy đủ
async function listProfiles(_req, res) {
  const profiles = await repo.listProfiles();
  return res.json(profiles);
}

// ✅ STAFF + ADMIN: danh sách public (lọc field)
async function listPublicProfiles(_req, res) {
  const profiles = await repo.listProfiles();
  const safe = (profiles || []).map((p) => ({
    user_id: p.user_id || p.userId || p._id,
    email: p.email,
    full_name: p.full_name || p.fullName || p.name || '',
    department: p.department || '',
    position: p.position || '',
    status: p.status || 'working',
    created_at: p.created_at || p.createdAt || null,
  }));
  return res.json(safe);
}

async function getProfile(req, res) {
  const profile = await repo.getByUserId(req.params.id);
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  return res.json(profile);
}

async function deleteProfile(req, res) {
  const deleted = await repo.deleteByUserId(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Profile not found' });
  return res.json(deleted);
}

async function updateProfileByAdmin(req, res) {
  const updated = await repo.updateByUserId(req.params.id, req.body.email, req.body || {});
  if (!updated) return res.status(404).json({ message: 'Profile not found' });
  return res.json(updated);
}

async function bootstrapProfile(req, res) {
  const { user_id: userId, email, full_name: fullName, ...rest } = req.body || {};
  if (!userId || !email) return res.status(400).json({ message: 'user_id và email là bắt buộc' });
  const data = { full_name: fullName, ...rest };
  const profile = await repo.upsertProfile(userId, email, data);
  return res.status(201).json(profile);
}

module.exports = {
  getMyProfile,
  updateMyProfile,
  listProfiles,
  listPublicProfiles, // ✅ thêm
  getProfile,
  deleteProfile,
  updateProfileByAdmin,
  bootstrapProfile
};
