require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Account = require('../models/Account');
const SystemConfig = require('../models/SystemConfig');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // Clear existing data
  await Promise.all([User.deleteMany(), Branch.deleteMany(), Account.deleteMany(), SystemConfig.deleteMany()]);

  // Create branches
  const [hq, dhaka, ctg] = await Branch.insertMany([
    { name: 'Head Office', address: '35 Motijheel CA', city: 'Dhaka', branchCode: 'HQ001', managerName: 'Karim Ahmed', phone: '01700000001' },
    { name: 'Mirpur Branch', address: '10 Mirpur Road', city: 'Dhaka', branchCode: 'DHK002', managerName: 'Sumaiya Begum', phone: '01700000002' },
    { name: 'Chittagong Branch', address: '5 Agrabad CA', city: 'Chittagong', branchCode: 'CTG003', managerName: 'Rahman Mia', phone: '01700000003' },
  ]);

  // Create admin
  const admin = await User.create({
    name: 'Admin User', email: 'admin@minibank.com', password: 'Admin@1234',
    role: 'admin', status: 'active', phone: '01711000000',
  });

  // Create officer
  const officer = await User.create({
    name: 'Karim Ahmed', email: 'officer@minibank.com', password: 'Officer@1234',
    role: 'officer', status: 'active', branch: hq._id, employeeId: 'EMP001', phone: '01712000000',
  });

  // Create customer
  const customer = await User.create({
    name: 'Rahim Uddin', email: 'customer@minibank.com', password: 'Customer@1234',
    role: 'customer', status: 'active', phone: '01713000000',
    nidNumber: '1234567890123', address: 'Dhaka, Bangladesh',
  });

  // Create active account for demo customer
  const account = await Account.create({
    customer: customer._id,
    branch: dhaka._id,
    type: 'savings',
    initialDeposit: 10000,
    balance: 10000,
    status: 'active',
    approvedBy: officer._id,
    approvedAt: new Date(),
  });

  // System configs
  await SystemConfig.insertMany([
    { key: 'savings_interest_rate', value: 5, description: 'Annual interest rate for savings accounts (%)' },
    { key: 'current_interest_rate', value: 3, description: 'Annual interest rate for current accounts (%)' },
    { key: 'loan_interest_rate_default', value: 9, description: 'Default annual loan interest rate (%)' },
    { key: 'min_balance_savings', value: 500, description: 'Minimum balance for savings accounts (BDT)' },
    { key: 'max_loan_amount', value: 1000000, description: 'Maximum loan amount (BDT)' },
  ]);

  console.log('\n✅ Database seeded successfully!\n');
  console.log('─── Login Credentials ───────────────────────');
  console.log('Admin   : admin@minibank.com     / Admin@1234');
  console.log('Officer : officer@minibank.com   / Officer@1234');
  console.log('Customer: customer@minibank.com  / Customer@1234');
  console.log('─────────────────────────────────────────────\n');
  process.exit(0);
};

seed().catch(err => { console.error(err); process.exit(1); });
