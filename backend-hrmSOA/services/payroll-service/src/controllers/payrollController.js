const repo = require('../repositories/payrollRepo');

async function createRun(req, res) {
  const { period, title } = req.body || {};
  if (!period) return res.status(400).json({ message: 'period is required, ví dụ 2025-01' });
  const run = await repo.createRun({ period, title });
  return res.status(201).json(run);
}

async function listRuns(_req, res) {
  const runs = await repo.listRuns();
  return res.json(runs);
}

async function getRun(req, res) {
  const run = await repo.getRun(req.params.id);
  if (!run) return res.status(404).json({ message: 'Payroll run not found' });
  const items = await repo.listItems(req.params.id);
  return res.json({ ...run, items });
}

async function updateRun(req, res) {
  const run = await repo.updateRun(req.params.id, req.body || {});
  if (!run) return res.status(404).json({ message: 'Payroll run not found' });
  return res.json(run);
}

async function deleteRun(req, res) {
  const deleted = await repo.deleteRun(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Payroll run not found' });
  return res.json(deleted);
}

async function upsertItem(req, res) {
  const runId = req.params.id;
  const { user_id: userId, email, base_salary: baseSalary } = req.body || {};
  if (!userId || !email) return res.status(400).json({ message: 'user_id và email là bắt buộc' });
  const item = await repo.upsertItem(runId, { ...req.body });
  return res.status(201).json(item);
}

async function updateItem(req, res) {
  const item = await repo.updateItem(req.params.id, req.params.itemId, req.body || {});
  if (!item) return res.status(404).json({ message: 'Payroll item not found' });
  return res.json(item);
}

async function recalc(req, res) {
  const items = await repo.recalcRun(req.params.id);
  return res.json(items);
}

async function exportCsv(req, res) {
  const run = await repo.getRun(req.params.id);
  if (!run) return res.status(404).json({ message: 'Payroll run not found' });
  const items = await repo.listItems(req.params.id);
  const escapeCsv = (v) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };
  const header = [
    'user_id',
    'full_name',
    'email',
    'department',
    'position',
    'base_salary',
    'bonus',
    'deductions',
    'net',
    'status'
  ];
  const rows = items.map((i) =>
    [
      escapeCsv(i.user_id),
      escapeCsv(i.full_name),
      escapeCsv(i.email),
      escapeCsv(i.department ?? ''),
      escapeCsv(i.position ?? ''),
      escapeCsv(i.base_salary ?? 0),
      escapeCsv(i.bonus ?? 0),
      escapeCsv(i.deductions ?? 0),
      escapeCsv(i.net ?? 0),
      escapeCsv(i.status)
    ].join(',')
  );
  const bom = '\uFEFF';
  const csv = bom + [header.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=payroll-${run.period}.csv`);
  return res.send(csv);
}

module.exports = {
  createRun,
  listRuns,
  getRun,
  updateRun,
  deleteRun,
  upsertItem,
  updateItem,
  recalc,
  exportCsv
};

