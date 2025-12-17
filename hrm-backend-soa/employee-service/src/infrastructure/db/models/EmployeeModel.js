const { Schema, model } = require('mongoose');
const EmployeeStatus = require('../../../domain/value-objects/EmployeeStatus');

// Schema Mongo cho nhân viên, ràng buộc email unique + enum status
const employeeSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    departmentId: { type: Schema.Types.ObjectId, ref: 'Department' },
    positionId: { type: Schema.Types.ObjectId, ref: 'Position' },
    status: {
      type: String,
      enum: Object.values(EmployeeStatus),
      default: EmployeeStatus.ACTIVE,
    },
    startDate: { type: Date },
    endDate: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const EmployeeModel = model('Employee', employeeSchema);

module.exports = EmployeeModel;
