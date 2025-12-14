const Employee = require("./employee.model");
const User = require("../auth/auth.model");
const { createError } = require("../../core/utils/httpError");

// Lấy danh sách nhân viên, có thể lọc theo query
async function listEmployees(filter = {}) {
  return Employee.find(filter).lean();
}

// Lấy chi tiết 1 nhân viên theo id
async function getEmployeeById(id) {
  const employee = await Employee.findById(id).lean();
  if (!employee) {
    throw createError(404, "Employee not found");
  }
  return employee;
}

// Tạo nhân viên mới, đảm bảo mã nhân viên duy nhất
async function createEmployee(payload) {
  const exists = await Employee.findOne({ code: payload.code });
  if (exists) {
    throw createError(400, "Employee code already exists");
  }
  const employee = await Employee.create(payload);
  return employee.toObject();
}

// Cập nhật nhân viên theo id
async function updateEmployee(id, payload) {
  const employee = await Employee.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  }).lean();
  if (!employee) {
    throw createError(404, "Employee not found");
  }
  return employee;
}

// Xóa nhân viên theo id
async function deleteEmployee(id) {
  const employee = await Employee.findByIdAndDelete(id).lean();
  if (!employee) {
    throw createError(404, "Employee not found");
  }
  // Xóa luôn user liên kết (nếu có)
  await User.deleteMany({ employeeId: id });
  return employee;
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};

