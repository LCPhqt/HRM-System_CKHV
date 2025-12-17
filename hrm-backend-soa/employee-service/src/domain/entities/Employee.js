const EmployeeStatus = require('../value-objects/EmployeeStatus');

// Entity thuần (domain) mô tả nhân viên
class Employee {
  constructor({
    id,
    name,
    email,
    departmentId,
    positionId,
    status = EmployeeStatus.ACTIVE,
    startDate,
    endDate,
    metadata,
  }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.departmentId = departmentId;
    this.positionId = positionId;
    this.status = status;
    this.startDate = startDate;
    this.endDate = endDate;
    this.metadata = metadata;
  }
}

module.exports = Employee;
