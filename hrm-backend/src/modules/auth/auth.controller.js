const {
  registerUser,
  loginUser,
  refreshTokens,
  sanitizeUser,
  issueTokens,
  updateProfile: updateProfileService,
} = require("./auth.service");
const {
  validateRegister,
  validateLogin,
  validateRefresh,
  validateUpdateProfile,
} = require("./auth.validator");
const { createEmployee } = require("../employee/employee.service");
const employeeService = require("../employee/employee.service");

function generateEmployeeCode() {
  return `EMP-${Date.now().toString(36).toUpperCase().slice(-6)}-${Math.floor(
    Math.random() * 900 + 100
  )}`;
}

// Đăng ký tài khoản: POST /api/auth/register
async function register(req, res, next) {
  try {
    const payload = validateRegister(req.body);
    const user = await registerUser(payload);

    // Tự động tạo employee tương ứng
    const code = generateEmployeeCode();
    const employee = await createEmployee({
      code,
      fullName: payload.fullName,
      position: payload.position || "Nhân viên",
      departmentId: payload.department || null,
      contact: {
        phone: payload.phone,
        email: payload.email,
      },
      status: "active",
    });

    // Liên kết user với employee
    user.employeeId = employee._id;
    await user.save();

    const tokens = issueTokens(user);

    res.status(201).json({
      success: true,
      data: { user: sanitizeUser(user), tokens },
    });
  } catch (err) {
    next(err);
  }
}

// Đăng nhập: POST /api/auth/login
async function login(req, res, next) {
  try {
    const payload = validateLogin(req.body);
    const { user, tokens } = await loginUser(payload);
    res.json({ success: true, data: { user: sanitizeUser(user), tokens } });
  } catch (err) {
    next(err);
  }
}

// Làm mới token: POST /api/auth/refresh
async function refresh(req, res, next) {
  try {
    const payload = validateRefresh(req.body);
    const { user, tokens } = await refreshTokens(payload.refreshToken);
    res.json({ success: true, data: { user: sanitizeUser(user), tokens } });
  } catch (err) {
    next(err);
  }
}

// Cập nhật hồ sơ user đang đăng nhập: PATCH /api/auth/profile
async function updateProfile(req, res, next) {
  try {
    const payload = validateUpdateProfile(req.body);
    const user = await updateProfileService(req.user.id, payload);

    // Đồng bộ sang employee nếu có employeeId
    if (user.employeeId) {
      const empPayload = {};
      if (payload.fullName) empPayload.fullName = payload.fullName;
      if (payload.position) empPayload.position = payload.position;
      if (payload.department) empPayload.departmentId = payload.department;
      if (payload.phone || payload.email) {
        empPayload.contact = {
          phone: payload.phone || user.phone,
          email: payload.email || user.email,
        };
      }
      if (Object.keys(empPayload).length > 0) {
        await employeeService.updateEmployee(user.employeeId, empPayload);
      }
    }

    res.json({ success: true, data: { user: sanitizeUser(user) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, refresh, updateProfile };

