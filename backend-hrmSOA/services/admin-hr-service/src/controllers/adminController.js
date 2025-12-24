const adminService = require('../services/adminService');

async function listEmployees(req, res) {
  const data = await adminService.listEmployees(req.token);
  return res.json(data);
}

async function getEmployee(req, res) {
  const data = await adminService.getEmployee(req.token, req.params.id);
  return res.json(data);
}

async function updateEmployee(req, res) {
  const data = await adminService.updateEmployee(req.token, req.params.id, req.body || {});
  return res.json(data);
}

async function createEmployee(req, res) {
  const data = await adminService.createEmployee(req.token, req.body || {});
  return res.status(201).json(data);
}

async function deleteEmployee(req, res) {
  await adminService.deleteEmployee(req.token, req.params.id);
  return res.json({ success: true });
}

module.exports = { listEmployees, getEmployee, updateEmployee, deleteEmployee, createEmployee };

