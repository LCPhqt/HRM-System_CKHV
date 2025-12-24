const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");

const Department = require("../models/Department");

const router = express.Router();

// ✅ staff + admin đều xem được
router.get("/", requireAuth, async (_req, res) => {
  const departments = await Department.find().sort({ createdAt: -1 });
  res.json(departments);
});

// ✅ admin tạo phòng ban
router.post("/", requireAuth, requireRole("admin"), async (req, res) => {
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
});

// ✅ admin xóa phòng ban
router.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const { id } = req.params;

  const dep = await Department.findById(id);
  if (!dep) return res.status(404).json({ message: "Không tìm thấy phòng ban" });

  await dep.deleteOne();
  res.json({ message: "Xóa phòng ban thành công" });
});

module.exports = router;
