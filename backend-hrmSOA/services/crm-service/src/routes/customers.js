const express = require("express");
const { requireAuth, requireRole } = require("../middlewares/auth");
const {
  listCustomers,
  countCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers,
  statsCustomers,
  listCustomerLogs,
  listDeletedCustomers,
  restoreCustomer,
  restoreMany,
  deleteCustomerHard,
  deleteManyHard
} = require("../controllers/customerController");

const router = express.Router();

router.use(requireAuth);

// Read: staff + admin
router.get("/", listCustomers);
router.get("/count", countCustomers);
router.get("/stats", statsCustomers);
router.get("/deleted", requireRole("admin"), listDeletedCustomers);
router.post("/import", importCustomers);
router.post("/restore/bulk", requireRole("admin"), restoreMany);
router.post("/:id/restore", requireRole("admin"), restoreCustomer);
router.delete("/:id/hard", requireRole("admin"), deleteCustomerHard);
router.post("/hard/bulk", requireRole("admin"), deleteManyHard);
router.get("/:id/logs", listCustomerLogs);
router.get("/:id", getCustomer);

// Write: staff quản lý khách hàng của chính mình; admin quản lý tất cả
router.post("/", createCustomer);
router.put("/:id", updateCustomer);
router.delete("/:id", deleteCustomer);

module.exports = router;


