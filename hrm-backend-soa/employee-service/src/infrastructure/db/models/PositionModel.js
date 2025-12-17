const { Schema, model } = require('mongoose');

// Schema Mongo cho chức vụ
const positionSchema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
  },
  { timestamps: true }
);

const PositionModel = model('Position', positionSchema);

module.exports = PositionModel;
