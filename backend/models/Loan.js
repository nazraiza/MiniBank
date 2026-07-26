const mongoose = require('mongoose');

const repaymentSchema = new mongoose.Schema({
  installmentNumber: { type: Number, required: true },
  dueDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  paid: { type: Boolean, default: false },
  paidAt: { type: Date },
  paidAmount: { type: Number },
});

const loanSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    amount: { type: Number, required: true, min: 1000 },
    purpose: { type: String, required: true, trim: true },
    tenureMonths: { type: Number, required: true, min: 1, max: 360 },
    interestRate: { type: Number }, // set by officer on approval
    monthlyInstallment: { type: Number },
    totalRepayable: { type: Number },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'closed'],
      default: 'pending',
    },
    rejectedReason: { type: String },
    repaymentSchedule: [repaymentSchema],
    decisionAt: { type: Date },
    loanRef: { type: String, unique: true },
  },
  { timestamps: true }
);

loanSchema.pre('validate', function (next) {
  if (!this.loanRef) {
    this.loanRef = `LN${Date.now()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  }
  next();
});

// Generate repayment schedule
loanSchema.methods.generateSchedule = function () {
  const r = this.interestRate / 100 / 12;
  const n = this.tenureMonths;
  const P = this.amount;
  // EMI formula
  const emi = r === 0 ? P / n : (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  this.monthlyInstallment = Math.round(emi * 100) / 100;
  this.totalRepayable = Math.round(emi * n * 100) / 100;

  this.repaymentSchedule = [];
  const startDate = new Date(this.decisionAt || Date.now());
  for (let i = 1; i <= n; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);
    this.repaymentSchedule.push({
      installmentNumber: i,
      dueDate,
      amount: this.monthlyInstallment,
      paid: false,
    });
  }
};

module.exports = mongoose.model('Loan', loanSchema);
