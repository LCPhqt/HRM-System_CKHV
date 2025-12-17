const { employeeRepository } = require('../../../container');
const listEmployees = require('./listEmployees');
const createEmployee = require('./createEmployee');
const getEmployee = require('./getEmployee');
const updateEmployee = require('./updateEmployee');
const deleteEmployee = require('./deleteEmployee');

// Gắn dependencies một lần, export các use-case đã khởi tạo
const deps = { employeeRepository };

module.exports = {
  listEmployees: listEmployees(deps),
  createEmployee: createEmployee(deps),
  getEmployee: getEmployee(deps),
  updateEmployee: updateEmployee(deps),
  deleteEmployee: deleteEmployee(deps),
};
