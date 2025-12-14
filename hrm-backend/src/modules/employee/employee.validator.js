const { createError } = require("../../core/utils/httpError");

// Kiểm tra dữ liệu tạo nhân viên
function validateCreate(body) {
  const { code, fullName } = body || {};
  const missing = [];
  if (!code) missing.push("code");
  if (!fullName) missing.push("fullName");
  if (missing.length) {
    throw createError(400, `Missing fields: ${missing.join(", ")}`);
  }

  return {
    code: String(code).trim(),
    fullName: String(fullName).trim(),
    departmentId: body.departmentId || null,
    position: body.position || null,
    managerId: body.managerId || null,
    status: body.status || "active",
    hireDate: body.hireDate || null,
    contact: body.contact || {},
  };
}

// Kiểm tra dữ liệu cập nhật nhân viên
function validateUpdate(body) {
  if (!body || Object.keys(body).length === 0) {
    throw createError(400, "Update payload is empty");
  }
  const allowed = [
    "fullName",
    "departmentId",
    "position",
    "managerId",
    "status",
    "hireDate",
    "contact",
    "password",
  ];
  const payload = {};
  allowed.forEach((key) => {
    if (body[key] !== undefined) payload[key] = body[key];
  });
  return payload;
}

module.exports = { validateCreate, validateUpdate };

