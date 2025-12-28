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
