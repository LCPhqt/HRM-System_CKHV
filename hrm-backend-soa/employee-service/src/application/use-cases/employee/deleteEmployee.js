const AppError = require('../../../shared/AppError');

// Use-case: xoá nhân viên, báo 404 nếu không tồn tại
module.exports = (deps) => async (id) => {
  const { employeeRepository } = deps;
  const deleted = await employeeRepository.delete(id);
  if (!deleted) {
    throw new AppError('Employee not found', 404, 'NOT_FOUND');
  }
  return deleted;
};
