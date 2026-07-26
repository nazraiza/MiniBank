const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  } catch (err) {
    console.error('Email send error:', err.message);
    // Don't throw — email failure shouldn't break the main flow
  }
};

exports.sendWelcomeEmail = (user) =>
  sendEmail({
    to: user.email,
    subject: 'Welcome to MiniBank!',
    html: `<h2>Welcome, ${user.name}!</h2><p>Your MiniBank account has been created. You can now log in and apply for a bank account.</p>`,
  });

exports.sendAccountApprovedEmail = (user, account) =>
  sendEmail({
    to: user.email,
    subject: 'Your Bank Account Has Been Approved',
    html: `<h2>Account Approved!</h2><p>Dear ${user.name}, your <b>${account.type}</b> account has been approved.</p><p><b>Account Number:</b> ${account.accountNumber}</p><p><b>Initial Balance:</b> BDT ${account.balance.toLocaleString()}</p>`,
  });

exports.sendAccountRejectedEmail = (user, reason) =>
  sendEmail({
    to: user.email,
    subject: 'Account Opening Request Rejected',
    html: `<h2>Account Request Rejected</h2><p>Dear ${user.name}, we regret to inform you that your account opening request has been rejected.</p><p><b>Reason:</b> ${reason}</p>`,
  });

exports.sendTransactionEmail = (user, txn, accountNumber) =>
  sendEmail({
    to: user.email,
    subject: `Transaction Alert — ${txn.type.replace('_', ' ').toUpperCase()}`,
    html: `<h2>Transaction Alert</h2><p>Dear ${user.name}, a transaction was recorded on your account.</p>
    <table border="1" cellpadding="8" style="border-collapse:collapse;">
      <tr><td>Account</td><td>${accountNumber}</td></tr>
      <tr><td>Type</td><td>${txn.type.replace('_', ' ').toUpperCase()}</td></tr>
      <tr><td>Amount</td><td>BDT ${txn.amount.toLocaleString()}</td></tr>
      <tr><td>Balance After</td><td>BDT ${txn.balanceAfter.toLocaleString()}</td></tr>
      <tr><td>Reference</td><td>${txn.transactionRef}</td></tr>
      <tr><td>Date</td><td>${new Date().toLocaleString()}</td></tr>
    </table>`,
  });

exports.sendLoanApprovedEmail = (user, loan) =>
  sendEmail({
    to: user.email,
    subject: 'Loan Application Approved',
    html: `<h2>Loan Approved!</h2><p>Dear ${user.name}, your loan application has been approved.</p>
    <p><b>Loan Amount:</b> BDT ${loan.amount.toLocaleString()}</p>
    <p><b>Interest Rate:</b> ${loan.interestRate}% p.a.</p>
    <p><b>Tenure:</b> ${loan.tenureMonths} months</p>
    <p><b>Monthly Installment:</b> BDT ${loan.monthlyInstallment.toLocaleString()}</p>
    <p><b>Loan Reference:</b> ${loan.loanRef}</p>
    <p>The loan amount has been credited to your account.</p>`,
  });

exports.sendLoanRejectedEmail = (user, reason) =>
  sendEmail({
    to: user.email,
    subject: 'Loan Application Rejected',
    html: `<h2>Loan Application Rejected</h2><p>Dear ${user.name}, we regret to inform you that your loan application has been rejected.</p><p><b>Reason:</b> ${reason}</p>`,
  });
