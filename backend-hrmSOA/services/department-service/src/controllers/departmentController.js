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
  const { name, code, parentId, location, manager, staffCount, description, status } = req.body || {};
  if (!name) return res.status(400).json({ message: "Tên phòng ban là bắt buộc" });

  if (code) {
    const existCode = await repo.findByCode(code);
    if (existCode) return res.status(400).json({ message: "Mã phòng ban đã tồn tại" });
  }

  const exist = await repo.findByName(name);
  if (exist) return res.status(400).json({ message: "Phòng ban đã tồn tại" });

  const dep = await repo.createDepartment({
    name,
    code,
    parentId: parentId || null,
    location: location || "",
    manager: manager || "",
    staffCount: staffCount || 0,
    description: description || "",
    status: status || "active",
  });

  return res.status(201).json(dep);
}

async function updateDepartment(req, res) {
  const { id } = req.params;
  const payload = req.body || {};

  const dep = await repo.getDepartment(id);
  if (!dep) return res.status(404).json({ message: "Không tìm thấy phòng ban" });

  // Kiểm tra trùng tên
  if (payload.name && payload.name !== dep.name) {
    const exist = await repo.findByName(payload.name);
    if (exist) return res.status(400).json({ message: "Tên phòng ban đã tồn tại" });
  }

  // Kiểm tra trùng code
  if (payload.code && payload.code !== dep.code) {
    const existCode = await repo.findByCode(payload.code);
    if (existCode) return res.status(400).json({ message: "Mã phòng ban đã tồn tại" });
  }

  const updated = await repo.updateDepartment(id, {
    ...("name" in payload ? { name: payload.name } : {}),
    ...("code" in payload ? { code: payload.code } : {}),
    ...("parentId" in payload ? { parentId: payload.parentId || null } : {}),
    ...("location" in payload ? { location: payload.location || "" } : {}),
    ...("manager" in payload ? { manager: payload.manager || "" } : {}),
    ...("staffCount" in payload ? { staffCount: payload.staffCount || 0 } : {}),
    ...("description" in payload ? { description: payload.description || "" } : {}),
    ...("status" in payload ? { status: payload.status } : {}),
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

