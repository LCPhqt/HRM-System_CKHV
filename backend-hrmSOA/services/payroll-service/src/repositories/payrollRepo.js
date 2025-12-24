const PayrollRun = require('../models/PayrollRun');
const PayrollItem = require('../models/PayrollItem');

const runToDto = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: d._id.toString(),
    period: d.period,
    title: d.title,
    status: d.status,
    created_at: d.createdAt,
    updated_at: d.updatedAt
  };
};

const itemToDto = (doc) => {
  if (!doc) return null;
  const d = doc.toObject ? doc.toObject() : doc;
  return {
    id: d._id.toString(),
    run_id: d.runId.toString(),
    user_id: d.userId,
    email: d.email,
    full_name: d.fullName,
    department: d.department ?? null,
    position: d.position ?? null,
    base_salary: d.baseSalary ?? 0,
    bonus: d.bonus ?? 0,
    deductions: d.deductions ?? 0,
    net: d.net ?? 0,
    status: d.status,
    created_at: d.createdAt,
    updated_at: d.updatedAt
  };
};

async function createRun(payload) {
  const doc = await PayrollRun.create({
    period: payload.period,
    title: payload.title || '',
    status: payload.status || 'draft'
  });
  return runToDto(doc);
}

async function listRuns() {
  const docs = await PayrollRun.find().sort({ createdAt: -1 }).lean();
  return docs.map(runToDto);
}

async function getRun(id) {
  const doc = await PayrollRun.findById(id).lean();
  return runToDto(doc);
}

async function updateRun(id, payload) {
  const doc = await PayrollRun.findByIdAndUpdate(
    id,
    { $set: { title: payload.title, status: payload.status, period: payload.period } },
    { new: true }
  ).lean();
  return runToDto(doc);
}

async function deleteRun(id) {
  await PayrollItem.deleteMany({ runId: id });
  const doc = await PayrollRun.findByIdAndDelete(id).lean();
  return runToDto(doc);
}

async function upsertItem(runId, payload) {
  const net = (Number(payload.base_salary) || 0) + (Number(payload.bonus) || 0) - (Number(payload.deductions) || 0);
  const doc = await PayrollItem.findOneAndUpdate(
    { runId, userId: payload.user_id },
    {
      $set: {
        email: payload.email,
        fullName: payload.full_name || '',
        department: payload.department,
        position: payload.position,
        baseSalary: payload.base_salary ?? 0,
        bonus: payload.bonus ?? 0,
        deductions: payload.deductions ?? 0,
        net,
        status: payload.status || 'pending'
      }
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return itemToDto(doc);
}

async function listItems(runId) {
  const docs = await PayrollItem.find({ runId }).sort({ createdAt: -1 }).lean();
  return docs.map(itemToDto);
}

async function updateItem(runId, itemId, payload) {
  const net =
    payload.net !== undefined
      ? payload.net
      : (Number(payload.base_salary) || 0) + (Number(payload.bonus) || 0) - (Number(payload.deductions) || 0);
  const doc = await PayrollItem.findOneAndUpdate(
    { _id: itemId, runId },
    {
      $set: {
        email: payload.email,
        fullName: payload.full_name,
        department: payload.department,
        position: payload.position,
        baseSalary: payload.base_salary,
        bonus: payload.bonus,
        deductions: payload.deductions,
        net,
        status: payload.status
      }
    },
    { new: true }
  ).lean();
  return itemToDto(doc);
}

async function recalcRun(runId) {
  const items = await PayrollItem.find({ runId }).lean();
  await Promise.all(
    items.map((it) =>
      PayrollItem.findByIdAndUpdate(it._id, {
        $set: { net: (Number(it.baseSalary) || 0) + (Number(it.bonus) || 0) - (Number(it.deductions) || 0) }
      })
    )
  );
  const updated = await PayrollItem.find({ runId }).lean();
  return updated.map(itemToDto);
}

module.exports = {
  createRun,
  listRuns,
  getRun,
  updateRun,
  deleteRun,
  upsertItem,
  listItems,
  updateItem,
  recalcRun
};

