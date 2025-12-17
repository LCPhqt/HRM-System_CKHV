// Use-case: liệt kê tất cả nhân viên
module.exports = (deps) => async () => {
  const { employeeRepository } = deps;
  return employeeRepository.findAll();
};
