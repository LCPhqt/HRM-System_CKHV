const AppError = require('../../../shared/AppError');

// Use-case: lấy chi tiết nhân viên
module.exports = (deps) => async (id) => {
  const { employeeRepository } = deps;
  const employee = await employeeRepository.findById(id);
  if (!employee) {
    throw new AppError('Employee not found', 404, 'NOT_FOUND');
  }
  return employee;
};
