const employeeUseCases = require('../../../application/use-cases/employee');

// Controller mỏng: nhận request, gọi use-case, trả JSON
const list = async (req, res, next) => {
  try {
    const employees = await employeeUseCases.listEmployees();
    res.json({ data: employees });
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const employee = await employeeUseCases.getEmployee(req.params.id);
    res.json({ data: employee });
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const employee = await employeeUseCases.createEmployee(req.body);
    res.status(201).json({ data: employee });
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const employee = await employeeUseCases.updateEmployee(req.params.id, req.body);
    res.json({ data: employee });
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    await employeeUseCases.deleteEmployee(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
};
