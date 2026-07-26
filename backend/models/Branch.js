const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String },
    managerName: { type: String },
    branchCode: { type: String, unique: true, required: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Branch', branchSchema);
