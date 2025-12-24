const bcrypt = require('bcryptjs');
const axios = require('axios');
const userRepo = require('../repositories/userRepo');
const { sign } = require('../utils/jwt');

const PROFILE_SERVICE_URL = process.env.PROFILE_SERVICE_URL || 'http://localhost:5002';

async function register(email, password, fullName) {
  const exists = await userRepo.findByEmail(email);
  if (exists) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }
  const hash = await bcrypt.hash(password, 10);
  const user = await userRepo.createUser(email, hash, 'staff');

  // Best-effort sync profile
  try {
    await axios.post(`${PROFILE_SERVICE_URL}/profiles/bootstrap`, {
      user_id: user.id,
      email,
      full_name: fullName || ''
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('Failed to create profile for user', email, err?.message);
  }

  const token = sign({ id: user.id, email: user.email, role: user.role });
  return { token, role: user.role, user };
}

async function login(email, password) {
  const user = await userRepo.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  const token = sign({ id: user._id.toString(), email: user.email, role: user.role });
  return { token, role: user.role };
}

module.exports = { register, login };

