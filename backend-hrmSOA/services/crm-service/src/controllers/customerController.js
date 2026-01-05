const repo = require("../repositories/customerRepo");
const auditRepo = require("../repositories/auditLogRepo");

function isAdmin(req) {
  return req.user?.role === "admin";
}

async function listCustomers(req, res) {
  const { search, status, ownerId, page, limit } = req.query || {};
  // staff chỉ được xem khách hàng của chính mình (ownerId lấy từ token)
  const effectiveOwnerId = isAdmin(req) ? ownerId : String(req.user?.id || "");
  const customers = await repo.listCustomers({
    search,
    status,
    ownerId: effectiveOwnerId,
    page,
    limit,
  });
  return res.json(customers);
}

async function countCustomers(req, res) {
  const { search, status, ownerId } = req.query || {};
  const effectiveOwnerId = isAdmin(req) ? ownerId : String(req.user?.id || "");
  const count = await repo.countCustomers({ search, status, ownerId: effectiveOwnerId });
  return res.json({ count });
}

async function statsCustomers(req, res) {
  const { ownerId } = req.query || {};
  const effectiveOwnerId = isAdmin(req) ? ownerId : String(req.user?.id || "");
  const stats = await repo.statusStats({ ownerId: effectiveOwnerId });
  const total = Math.max(0, Number(stats.total || 0));
  const pct = (v) => (total === 0 ? 0 : Number(((v / total) * 100).toFixed(1)));
  return res.json({
    ...stats,
    activePercent: pct(stats.active),
    leadPercent: pct(stats.lead),
    inactivePercent: pct(stats.inactive),
    otherPercent: pct(stats.other),
  });
}

async function getCustomer(req, res) {
  const customer = await repo.getCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (customer.deleted) return res.status(404).json({ message: "Khách hàng đã bị xóa" });
  if (!isAdmin(req) && String(customer.ownerId || "") !== String(req.user?.id || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.json(customer);
}

async function listCustomerLogs(req, res) {
  const { id } = req.params;
  const { action, actorId, from, to, page, limit } = req.query || {};

  const customer = await repo.getCustomer(id);
  if (!customer) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (!isAdmin(req) && String(customer.ownerId || "") !== String(req.user?.id || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const logs = await auditRepo.listLogs({
    customerId: String(id),
    action,
    actorId,
    from,
    to,
    page,
    limit,
  });
  return res.json(logs);
}

async function logAuditSafe(payload) {
  try {
    await auditRepo.createLog(payload);
  } catch (err) {
    console.warn("Audit log failed", err?.message || err);
  }
}

async function createCustomer(req, res) {
  const { name, cccd, email, phone, address, ownerId, status } = req.body || {};
  if (!name) return res.status(400).json({ message: "Tên khách hàng là bắt buộc" });

  // staff: auto-assign ownerId = user.id, không cho gán owner người khác
  const assignedOwnerId = isAdmin(req) ? String(ownerId || "") : String(req.user?.id || "");
  const ownerName =
    isAdmin(req) && req.body?.ownerName
      ? String(req.body.ownerName || "")
      : req.user?.email || "";

  const exist = await repo.findByNameAndOwner(name, assignedOwnerId);
  if (exist) return res.status(400).json({ message: "Khách hàng đã tồn tại" });

  const created = await repo.createCustomer({
    name,
    cccd: cccd || "",
    email: email || "",
    phone: phone || "",
    address: address || "",
    ownerId: assignedOwnerId,
    ownerName: ownerName || "",
    status: status || "lead"
  });
  await logAuditSafe({
    customerId: String(created.id),
    action: "create",
    actorId: String(req.user?.id || ""),
    actorEmail: req.user?.email || "",
    before: null,
    after: created,
    success: true,
  });
  return res.status(201).json(created);
}

async function updateCustomer(req, res) {
  const { id } = req.params;
  const payload = req.body || {};

  const current = await repo.getCustomer(id);
  if (!current) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (current.deleted) return res.status(400).json({ message: "Khách hàng đã bị xóa, cần khôi phục trước khi sửa" });

  if (!isAdmin(req) && String(current.ownerId || "") !== String(req.user?.id || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if ("name" in payload && !payload.name) {
    return res.status(400).json({ message: "Tên khách hàng là bắt buộc" });
  }

  // Unique theo owner (không xung đột giữa các nhân viên)
  const nextOwnerId =
    isAdmin(req) && "ownerId" in payload
      ? String(payload.ownerId || "")
      : String(current.ownerId || "");
  const nextName = "name" in payload ? payload.name : current.name;

  if (nextName && (nextName !== current.name || nextOwnerId !== String(current.ownerId || ""))) {
    const exist = await repo.findByNameAndOwner(nextName, nextOwnerId);
    if (exist && String(exist.id) !== String(current.id)) {
      return res.status(400).json({ message: "Tên khách hàng đã tồn tại" });
    }
  }

  const updated = await repo.updateCustomer(id, {
    ...("name" in payload ? { name: payload.name } : {}),
    ...("cccd" in payload ? { cccd: payload.cccd || "" } : {}),
    ...("email" in payload ? { email: payload.email || "" } : {}),
    ...("phone" in payload ? { phone: payload.phone || "" } : {}),
    ...("address" in payload ? { address: payload.address || "" } : {}),
    ...(isAdmin(req) && "ownerId" in payload ? { ownerId: nextOwnerId } : {}),
    ...(isAdmin(req) && "ownerName" in payload ? { ownerName: payload.ownerName || "" } : {}),
    ...("status" in payload ? { status: payload.status } : {})
  });
  await logAuditSafe({
    customerId: String(id),
    action: "update",
    actorId: String(req.user?.id || ""),
    actorEmail: req.user?.email || "",
    before: current,
    after: updated,
    success: true,
  });

  return res.json(updated);
}

async function deleteCustomer(req, res) {
  const current = await repo.getCustomer(req.params.id);
  if (!current) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (current.deleted) return res.status(400).json({ message: "Khách hàng đã bị xóa" });
  if (!isAdmin(req) && String(current.ownerId || "") !== String(req.user?.id || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await repo.updateCustomer(req.params.id, {
    deleted: true,
    deletedAt: new Date(),
    deletedBy: String(req.user?.id || ""),
    deletedByEmail: req.user?.email || "",
  });
  await logAuditSafe({
    customerId: String(req.params.id),
    action: "delete",
    actorId: String(req.user?.id || ""),
    actorEmail: req.user?.email || "",
    before: current,
    after: null,
    success: true,
  });
  return res.json({ message: "Xóa khách hàng thành công" });
}

async function importCustomers(req, res) {
  const body = req.body;
  const customers = Array.isArray(body) ? body : body?.customers;
  if (!Array.isArray(customers)) {
    return res.status(400).json({
      message: "Body phải là mảng customers hoặc { customers: [...] }"
    });
  }

  // staff: auto-assign ownerId cho mọi record import
  const assignedOwnerId = isAdmin(req) ? null : String(req.user?.id || "");
  const normalized = customers.map((c) => ({
    ...c,
    ownerId: assignedOwnerId === null ? String(c?.ownerId || "") : assignedOwnerId,
    ownerName:
      assignedOwnerId === null
        ? String(c?.ownerName || "")
        : req.user?.email || ""
  }));

  const report = await repo.importCustomers(normalized);
  await logAuditSafe({
    customerId: "bulk",
    action: "import",
    actorId: String(req.user?.id || ""),
    actorEmail: req.user?.email || "",
    before: null,
    after: null,
    meta: {
      created: report.createdCount,
      skipped: report.skippedCount,
      errors: report.errorCount,
    },
    success: true,
  });
  return res.status(201).json(report);
}

async function listDeletedCustomers(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { page, limit } = req.query || {};
  const ownerId = req.query?.ownerId;
  const items = await repo.listDeletedCustomers({ ownerId, page, limit });
  return res.json(items);
}

async function restoreCustomer(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { id } = req.params;
  const current = await repo.getCustomer(id);
  if (!current) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (!current.deleted) return res.status(400).json({ message: "Khách hàng chưa bị xóa" });

  const restored = await repo.restoreCustomer(id);
  await logAuditSafe({
    customerId: String(id),
    action: "restore",
    actorId: String(req.user?.id || ""),
    actorEmail: req.user?.email || "",
    before: current,
    after: restored,
    success: true,
  });
  return res.json(restored);
}

async function restoreMany(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Cần truyền mảng ids" });
  }
  const actorId = String(req.user?.id || "");
  const actorEmail = req.user?.email || "";
  const restored = [];
  const skipped = [];
  for (const rawId of ids) {
    const id = String(rawId || "");
    try {
      const current = await repo.getCustomer(id);
      if (!current || !current.deleted) {
        skipped.push({ id, reason: "not_deleted_or_not_found" });
        continue;
      }
      const r = await repo.restoreCustomer(id);
      restored.push(r);
      await logAuditSafe({
        customerId: String(id),
        action: "restore",
        actorId,
        actorEmail,
        before: current,
        after: r,
        success: true,
      });
    } catch (err) {
      skipped.push({ id, reason: err?.message || "error" });
    }
  }
  return res.json({ restoredCount: restored.length, restored, skippedCount: skipped.length, skipped });
}

async function deleteCustomerHard(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { id } = req.params;
  const current = await repo.getCustomer(id);
  if (!current) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (!current.deleted) return res.status(400).json({ message: "Khách hàng chưa bị xóa" });
  const deleted = await repo.deleteCustomerHard(id);
  await logAuditSafe({
    customerId: String(id),
    action: "hard_delete",
    actorId: String(req.user?.id || ""),
    actorEmail: req.user?.email || "",
    before: current,
    after: null,
    success: true,
  });
  return res.json({ message: "Đã xóa vĩnh viễn", deleted });
}

async function deleteManyHard(req, res) {
  if (!isAdmin(req)) return res.status(403).json({ message: "Forbidden" });
  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ message: "Cần truyền mảng ids" });
  }
  const actorId = String(req.user?.id || "");
  const actorEmail = req.user?.email || "";
  const okIds = [];
  const skipped = [];

  for (const rawId of ids) {
    const id = String(rawId || "");
    try {
      const current = await repo.getCustomer(id);
      if (!current || !current.deleted) {
        skipped.push({ id, reason: "not_deleted_or_not_found" });
        continue;
      }
      okIds.push(id);
    } catch (err) {
      skipped.push({ id, reason: err?.message || "error" });
    }
  }

  let deletedCount = 0;
  if (okIds.length > 0) {
    deletedCount = await repo.deleteCustomersHard(okIds);
    for (const id of okIds) {
      await logAuditSafe({
        customerId: String(id),
        action: "hard_delete",
        actorId,
        actorEmail,
        before: null,
        after: null,
        success: true,
      });
    }
  }

  return res.json({ deletedCount, skippedCount: skipped.length, skipped });
}

module.exports = {
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
};


