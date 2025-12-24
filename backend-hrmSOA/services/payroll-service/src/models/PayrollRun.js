const mongoose = require('mongoose');

const payrollRunSchema = new mongoose.Schema(
  {
    period: { type: String, required: true }, // e.g. 2025-01
    title: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'calculated', 'locked'], default: 'draft' }
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

module.exports = mongoose.model('PayrollRun', payrollRunSchema);

