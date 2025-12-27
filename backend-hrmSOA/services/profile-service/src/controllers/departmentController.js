const repo = require("../repositories/departmentRepo");

async function listDepartments(_req, res) {
  const departments = await repo.listDepartments();
  return res.json(departments);
}

async function getDepartment(req, res) {
  const dep = await repo.getDepartment(req.params.id);
  if (!dep) return res.status(404).json({ message: "Không tìm thấy phòng ban" });
  return res.json(dep);
}

async function createDepartment(req, res) {
  const { name, location, manager, staffCount, description } = req.body || {};
  if (!name) return res.status(400).json({ message: "Tên phòng ban là bắt buộc" });

  const exist = await repo.findByName(name);
  if (exist) return res.status(400).json({ message: "Phòng ban đã tồn tại" });

  const dep = await repo.createDepartment({
    name,
    location: location || "",
    manager: manager || "",
    staffCount: staffCount || 0,
    description: description || "",
  });

  return res.status(201).json(dep);
}

async function updateDepartment(req, res) {
  const { id } = req.params;
  const payload = req.body || {};

  const dep = await repo.getDepartment(id);
  if (!dep) return res.status(404).json({ message: "Không tìm thấy phòng ban" });

  // Kiểm tra trùng tên nếu đổi name
  if (payload.name && payload.name !== dep.name) {
    const exist = await repo.findByName(payload.name);
    if (exist) return res.status(400).json({ message: "Tên phòng ban đã tồn tại" });
  }

  const updated = await repo.updateDepartment(id, {
    ...("name" in payload ? { name: payload.name } : {}),
    ...("location" in payload ? { location: payload.location || "" } : {}),
    ...("manager" in payload ? { manager: payload.manager || "" } : {}),
    ...("staffCount" in payload ? { staffCount: payload.staffCount || 0 } : {}),
    ...("description" in payload ? { description: payload.description || "" } : {}),
  });

  return res.json(updated);
}

async function deleteDepartment(req, res) {
  const deleted = await repo.deleteDepartment(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Không tìm thấy phòng ban" });
  return res.json({ message: "Xóa phòng ban thành công" });
}

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
const Department = require("../models/Department");

// ✅ GET /departments (staff + admin)
exports.getDepartments = async (_req, res) => {
  const departments = await Department.find().sort({ createdAt: -1 });
  res.json(departments);
};

// ✅ POST /departments (admin)
exports.createDepartment = async (req, res) => {
  const { name, location, manager, staffCount } = req.body;
  if (!name) return res.status(400).json({ message: "Tên phòng ban là bắt buộc" });

  const exist = await Department.findOne({ name });
  if (exist) return res.status(400).json({ message: "Phòng ban đã tồn tại" });

  const dep = await Department.create({
    name,
    location: location || "",
    manager: manager || "",
    staffCount: staffCount || 0,
  });

  res.status(201).json(dep);
};

// ✅ PUT /departments/:id (admin)
exports.updateDepartment = async (req, res) => {
  const { id } = req.params;
  const dep = await Department.findById(id);
  if (!dep) return res.status(404).json({ message: "Không tìm thấy phòng ban" });

  dep.name = req.body.name ?? dep.name;
  dep.location = req.body.location ?? dep.location;
  dep.manager = req.body.manager ?? dep.manager;
  dep.staffCount = req.body.staffCount ?? dep.staffCount;

  await dep.save();
  res.json(dep);
};

// ✅ DELETE /departments/:id (admin)
exports.deleteDepartment = async (req, res) => {
  const { id } = req.params;
  const dep = await Department.findById(id);
  if (!dep) return res.status(404).json({ message: "Không tìm thấy phòng ban" });

  await dep.deleteOne();
  res.json({ message: "Xóa phòng ban thành công" });
};
