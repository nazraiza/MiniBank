const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    type: {
      type: String,
      enum: ['deposit', 'withdrawal', 'transfer_in', 'transfer_out'],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    balanceAfter: { type: Number, required: true },
    referenceAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
    note: { type: String, trim: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // officer if OTC
    transactionRef: { type: String, unique: true }, // unique reference code
  },
  { timestamps: true }
);

transactionSchema.pre('validate', function (next) {
  if (!this.transactionRef) {
    this.transactionRef = `TXN${Date.now()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
