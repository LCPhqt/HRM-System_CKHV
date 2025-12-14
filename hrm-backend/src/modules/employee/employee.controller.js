const employeeService = require("./employee.service");
const { validateCreate, validateUpdate } = require("./employee.validator");
const User = require("../auth/auth.model");
const bcrypt = require("bcryptjs");

// Lấy danh sách nhân viên: GET /api/employees
async function list(req, res, next) {
  try {
    const filter = {};
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.query.status) filter.status = req.query.status;
    const employees = await employeeService.listEmployees(filter);
    res.json({ success: true, data: employees });
  } catch (err) {
    next(err);
  }
}

// Lấy chi tiết nhân viên: GET /api/employees/:id
async function detail(req, res, next) {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

// Tạo nhân viên: POST /api/employees
async function create(req, res, next) {
  try {
    const payload = validateCreate(req.body);
    const employee = await employeeService.createEmployee(payload);
    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

// Cập nhật nhân viên: PUT /api/employees/:id
async function update(req, res, next) {
  try {
    const payload = validateUpdate(req.body);
    const { password, ...rest } = payload;

    const employee = await employeeService.updateEmployee(req.params.id, rest);

    if (password) {
      const user = await User.findOne({ employeeId: req.params.id });
      if (user) {
        user.passwordHash = await bcrypt.hash(password, 10);
        await user.save();
      }
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

// Xóa nhân viên: DELETE /api/employees/:id
async function remove(req, res, next) {
  try {
    const employee = await employeeService.deleteEmployee(req.params.id);
    res.json({ success: true, data: employee });
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create, update, remove };

