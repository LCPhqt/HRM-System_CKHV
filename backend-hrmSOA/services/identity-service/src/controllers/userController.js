const userRepo = require('../repositories/userRepo');

async function listUsers(_req, res) {
  const users = await userRepo.listUsers();
  return res.json(users);
}

async function getUser(req, res) {
  const user = await userRepo.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
}

async function updateUser(req, res) {
  const updated = await userRepo.updateUser(req.params.id, req.body || {});
  if (!updated) return res.status(404).json({ message: 'User not found' });
  return res.json(updated);
}

async function deleteUser(req, res) {
  const deleted = await userRepo.deleteUser(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'User not found' });
  return res.json(deleted);
}

module.exports = { listUsers, getUser, updateUser, deleteUser };

