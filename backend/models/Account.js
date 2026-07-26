const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema(
  {
    accountNumber: { type: String, unique: true, required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    type: { type: String, enum: ['savings', 'current'], required: true },
    balance: { type: Number, default: 0, min: 0 },
    initialDeposit: { type: Number, required: true },
    interestRate: { type: Number, default: 5 }, // annual %
    status: {
      type: String,
      enum: ['pending', 'active', 'frozen', 'closed'],
      default: 'pending',
    },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    rejectedReason: { type: String },
  },
  { timestamps: true }
);

// Generate account number before save
accountSchema.pre('validate', async function (next) {
  if (!this.accountNumber) {
    const count = await mongoose.model('Account').countDocuments();
    this.accountNumber = `MB${Date.now().toString().slice(-6)}${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Account', accountSchema);
