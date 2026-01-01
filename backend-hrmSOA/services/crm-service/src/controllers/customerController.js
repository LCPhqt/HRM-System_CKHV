const repo = require("../repositories/customerRepo");

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

async function getCustomer(req, res) {
  const customer = await repo.getCustomer(req.params.id);
  if (!customer) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (!isAdmin(req) && String(customer.ownerId || "") !== String(req.user?.id || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }
  return res.json(customer);
}

async function createCustomer(req, res) {
  const { name, email, phone, address, industry, ownerId, status, tags } = req.body || {};
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
    email: email || "",
    phone: phone || "",
    address: address || "",
    industry: industry || "",
    ownerId: assignedOwnerId,
    ownerName: ownerName || "",
    status: status || "lead",
    tags: Array.isArray(tags) ? tags : []
  });
  return res.status(201).json(created);
}

async function updateCustomer(req, res) {
  const { id } = req.params;
  const payload = req.body || {};

  const current = await repo.getCustomer(id);
  if (!current) return res.status(404).json({ message: "Không tìm thấy khách hàng" });

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
    ...("email" in payload ? { email: payload.email || "" } : {}),
    ...("phone" in payload ? { phone: payload.phone || "" } : {}),
    ...("address" in payload ? { address: payload.address || "" } : {}),
    ...("industry" in payload ? { industry: payload.industry || "" } : {}),
    ...(isAdmin(req) && "ownerId" in payload ? { ownerId: nextOwnerId } : {}),
    ...(isAdmin(req) && "ownerName" in payload ? { ownerName: payload.ownerName || "" } : {}),
    ...("status" in payload ? { status: payload.status } : {}),
    ...("tags" in payload ? { tags: Array.isArray(payload.tags) ? payload.tags : [] } : {})
  });

  return res.json(updated);
}

async function deleteCustomer(req, res) {
  const current = await repo.getCustomer(req.params.id);
  if (!current) return res.status(404).json({ message: "Không tìm thấy khách hàng" });
  if (!isAdmin(req) && String(current.ownerId || "") !== String(req.user?.id || "")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  await repo.deleteCustomer(req.params.id);
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
  return res.status(201).json(report);
}

module.exports = {
  listCustomers,
  countCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  importCustomers
};


