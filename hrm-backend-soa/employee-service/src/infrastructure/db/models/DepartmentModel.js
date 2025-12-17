const { Schema, model } = require('mongoose');

// Schema Mongo cho phòng ban
const departmentSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

const DepartmentModel = model('Department', departmentSchema);

module.exports = DepartmentModel;
