const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./auth.model");
const { createError } = require("../../core/utils/httpError");

const ACCESS_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES || "15m";
const REFRESH_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES || "7d";

// Tạo access token (sống ngắn) ký bằng JWT_SECRET
function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

// Tạo refresh token (sống dài) ký bằng REFRESH_SECRET (hoặc JWT_SECRET)
function signRefreshToken(payload) {
  const secret = process.env.REFRESH_SECRET || process.env.JWT_SECRET;
  return jwt.sign(payload, secret, { expiresIn: REFRESH_EXPIRES_IN });
}

function issueTokens(user) {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    roles: user.roles || [],
  };
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

// Loại bỏ thông tin nhạy cảm trước khi trả về client
function sanitizeUser(user) {
  return {
    id: user._id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    position: user.position,
    department: user.department,
    roles: user.roles,
    status: user.status,
    employeeId: user.employeeId,
  };
}

// Đăng ký user: hash mật khẩu và gán role mặc định
async function registerUser({ email, password, roles, fullName, phone, position, department }) {
  if (!email || !password) {
    throw createError(400, "Email and password are required");
  }

  const existing = await User.findOne({ email });
  if (existing) {
    throw createError(400, "Email already in use");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    email,
    fullName,
    phone,
    position,
    department,
    passwordHash,
    roles: roles?.length ? roles : ["employee"],
  });

  return user;
}

// Kiểm tra đăng nhập và cấp token
async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) {
    throw createError(401, "Invalid credentials");
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw createError(401, "Invalid credentials");
  }

  return { user, tokens: issueTokens(user) };
}

// Xác thực refresh token và cấp lại token mới
async function refreshTokens(refreshToken) {
  if (!refreshToken) {
    throw createError(401, "Refresh token is required");
  }

  const secret = process.env.REFRESH_SECRET || process.env.JWT_SECRET;
  let payload;
  try {
    payload = jwt.verify(refreshToken, secret);
  } catch (err) {
    throw createError(401, "Invalid or expired refresh token");
  }

  const user = await User.findById(payload.sub);
  if (!user) {
    throw createError(401, "User not found");
  }

  return { user, tokens: issueTokens(user) };
}

async function updateProfile(userId, payload) {
  const user = await User.findByIdAndUpdate(userId, payload, {
    new: true,
    runValidators: true,
  });
  if (!user) throw createError(404, "User not found");
  return user;
}

module.exports = {
  registerUser,
  loginUser,
  refreshTokens,
  sanitizeUser,
  issueTokens,
  updateProfile,
};

