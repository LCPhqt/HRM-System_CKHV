const Department = require("../models/Department");

async function listDepartments() {
  return Department.find().sort({ createdAt: -1 }).lean();
}

async function getDepartment(id) {
  return Department.findById(id).lean();
}

async function createDepartment(payload) {
  return Department.create(payload);
}

async function updateDepartment(id, payload) {
  return Department.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean();
}

async function deleteDepartment(id) {
  return Department.findByIdAndDelete(id).lean();
}

async function findByName(name) {
  return Department.findOne({ name }).lean();
}

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  findByName,
};

