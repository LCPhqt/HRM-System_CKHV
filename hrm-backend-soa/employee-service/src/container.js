const EmployeeModel = require('./infrastructure/db/models/EmployeeModel');
const DepartmentModel = require('./infrastructure/db/models/DepartmentModel');
const PositionModel = require('./infrastructure/db/models/PositionModel');
const EmployeeRepository = require('./infrastructure/repositories/EmployeeRepository');
const DepartmentRepository = require('./infrastructure/repositories/DepartmentRepository');
const PositionRepository = require('./infrastructure/repositories/PositionRepository');

// Khởi tạo repository và xuất cho toàn service (DI đơn giản)
const employeeRepository = new EmployeeRepository(EmployeeModel);
const departmentRepository = new DepartmentRepository(DepartmentModel);
const positionRepository = new PositionRepository(PositionModel);

module.exports = {
  employeeRepository,
  departmentRepository,
  positionRepository,
};
