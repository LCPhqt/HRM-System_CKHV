const repo = require('../repositories/profileRepo');

async function getMyProfile(req, res) {
  const profile = await repo.getByUserId(req.user.id);
  if (!profile) return res.status(404).json({ message: 'Profile not found' });
  return res.json(profile);
}

async function updateMyProfile(req, res) {
  const updated = await repo.upsertProfile(req.user.id, req.user.email, req.body || {});
  return res.json(updated);
}

async function listProfiles(_req, res) {
  const profiles = await repo.listProfiles();
  return res.json(profiles);
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
  getProfile,
  deleteProfile,
  updateProfileByAdmin,
  bootstrapProfile
};

