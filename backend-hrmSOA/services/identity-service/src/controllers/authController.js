const authService = require('../services/authService');
const userRepo = require('../repositories/userRepo');

async function register(req, res) {
  try {
    const { email, password, confirm_password: confirmPassword, full_name: fullName } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email và mật khẩu là bắt buộc' });
    if (password !== confirmPassword) return res.status(400).json({ message: 'Mật khẩu nhập lại không khớp' });
    const result = await authService.register(email, password, fullName);
    return res.status(201).json({ accessToken: result.token, role: result.role, user: result.user });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Registration failed' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
    const result = await authService.login(email, password);
    return res.json({ accessToken: result.token, role: result.role });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({ message: err.message || 'Login failed' });
  }
}

async function me(req, res) {
  const user = await userRepo.findById(req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  return res.json(user);
}

module.exports = { register, login, me };

