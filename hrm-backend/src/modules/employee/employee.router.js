const express = require("express");
const { authGuard } = require("../../core/middleware/auth");
const {
  list,
  detail,
  create,
  update,
  remove,
} = require("./employee.controller");

const router = express.Router();

// Tạm thời bỏ authGuard để tránh 401/403 khi thử nghiệm
// router.use(authGuard);

router.get("/", list);
router.get("/:id", detail);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);

module.exports = router;

