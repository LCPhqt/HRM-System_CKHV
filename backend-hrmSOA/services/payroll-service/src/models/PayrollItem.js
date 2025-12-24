const mongoose = require('mongoose');

const payrollItemSchema = new mongoose.Schema(
  {
    runId: { type: mongoose.Schema.Types.ObjectId, ref: 'PayrollRun', required: true },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    fullName: { type: String, default: '' },
    department: String,
    position: String,
    baseSalary: { type: Number, default: 0 },
    bonus: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    net: { type: Number, default: 0 },
    status: { type: String, enum: ['pending', 'paid'], default: 'pending' }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('PayrollItem', payrollItemSchema);

