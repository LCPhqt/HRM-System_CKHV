const AppError = require('../../../shared/AppError');

// Use-case: cập nhật nhân viên, trả 404 nếu không tồn tại
module.exports = (deps) => async (id, payload) => {
  const { employeeRepository } = deps;
  const updated = await employeeRepository.update(id, payload);
  if (!updated) {
    throw new AppError('Employee not found', 404, 'NOT_FOUND');
  }
  return updated;
};
