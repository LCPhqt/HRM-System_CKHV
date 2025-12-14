const { createError } = require("../../core/utils/httpError");

// Kiểm tra dữ liệu đăng ký
function validateRegister(body) {
  const { email, password, roles, fullName, phone, position, department } = body || {};
  const missing = [];
  if (!email) missing.push("email");
  if (!password) missing.push("password");
  if (!fullName) missing.push("fullName");
  if (!phone) missing.push("phone");
  if (missing.length) {
    throw createError(400, `Missing fields: ${missing.join(", ")}`);
  }
  return {
    email: String(email).toLowerCase().trim(),
    password: String(password),
    roles: Array.isArray(roles) ? roles : undefined,
    fullName: String(fullName).trim(),
    phone: String(phone).trim(),
    position: position ? String(position).trim() : "",
    department: department ? String(department).trim() : "",
  };
}

// Kiểm tra dữ liệu đăng nhập
function validateLogin(body) {
  const { email, password } = body || {};
  if (!email || !password) {
    throw createError(400, "Email and password are required");
  }
  return {
    email: String(email).toLowerCase().trim(),
    password: String(password),
  };
}

// Kiểm tra dữ liệu refresh token
function validateRefresh(body) {
  const { refreshToken } = body || {};
  if (!refreshToken) {
    throw createError(400, "Refresh token is required");
  }
  return { refreshToken: String(refreshToken) };
}

// Kiểm tra dữ liệu cập nhật hồ sơ
function validateUpdateProfile(body) {
  const allowed = ["fullName", "phone", "position", "department"];
  const payload = {};
  allowed.forEach((k) => {
    if (body && body[k] !== undefined) {
      payload[k] = String(body[k]).trim();
    }
  });
  if (Object.keys(payload).length === 0) {
    throw createError(400, "No fields to update");
  }
  return payload;
}

module.exports = { validateRegister, validateLogin, validateRefresh, validateUpdateProfile };

