const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

const router = express.Router();

// staff + admin xem danh sách/chi tiết
router.get("/", requireAuth, listDepartments);
router.get("/:id", requireAuth, getDepartment);

// admin CRUD
router.post("/", requireAuth, requireRole("admin"), createDepartment);
router.put("/:id", requireAuth, requireRole("admin"), updateDepartment);
router.delete("/:id", requireAuth, requireRole("admin"), deleteDepartment);

module.exports = router;

