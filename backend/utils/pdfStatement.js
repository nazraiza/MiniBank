const PDFDocument = require('pdfkit');

const generateStatement = (res, account, customer, transactions, fromDate, toDate) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=statement_${account.accountNumber}_${Date.now()}.pdf`
  );
  doc.pipe(res);

  // Header
  doc.fontSize(20).fillColor('#1B3A6B').text('MiniBank', { align: 'center' });
  doc.fontSize(12).fillColor('#333').text('Account Statement', { align: 'center' });
  doc.moveDown();

  // Divider
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1B3A6B');
  doc.moveDown();

  // Account Info
  doc.fontSize(11).fillColor('#000');
  doc.text(`Account Holder: ${customer.name}`);
  doc.text(`Account Number: ${account.accountNumber}`);
  doc.text(`Account Type: ${account.type.charAt(0).toUpperCase() + account.type.slice(1)}`);
  doc.text(`Current Balance: BDT ${account.balance.toLocaleString()}`);
  doc.text(`Statement Period: ${fromDate ? new Date(fromDate).toLocaleDateString() : 'All time'} — ${toDate ? new Date(toDate).toLocaleDateString() : 'Today'}`);
  doc.text(`Generated On: ${new Date().toLocaleString()}`);
  doc.moveDown();

  // Table header
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
  doc.moveDown(0.5);

  const colX = { date: 50, type: 160, note: 280, amount: 390, balance: 470 };

  doc.fontSize(9).fillColor('#1B3A6B').font('Helvetica-Bold');
  doc.text('Date', colX.date, doc.y, { width: 100 });
  doc.text('Type', colX.type, doc.y - doc.currentLineHeight(), { width: 110 });
  doc.text('Note', colX.note, doc.y - doc.currentLineHeight(), { width: 100 });
  doc.text('Amount (BDT)', colX.amount, doc.y - doc.currentLineHeight(), { width: 80 });
  doc.text('Balance', colX.balance, doc.y - doc.currentLineHeight(), { width: 80 });
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ccc');
  doc.moveDown(0.3);

  doc.font('Helvetica').fontSize(8).fillColor('#000');

  transactions.forEach((txn) => {
    const isCredit = txn.type === 'deposit' || txn.type === 'transfer_in';
    const amountStr = `${isCredit ? '+' : '-'} ${txn.amount.toLocaleString()}`;
    const y = doc.y;

    doc.fillColor('#333').text(new Date(txn.createdAt).toLocaleDateString(), colX.date, y, { width: 100 });
    doc.text(txn.type.replace('_', ' ').toUpperCase(), colX.type, y, { width: 110 });
    doc.text(txn.note || '—', colX.note, y, { width: 100 });
    doc.fillColor(isCredit ? 'green' : 'red').text(amountStr, colX.amount, y, { width: 80 });
    doc.fillColor('#333').text(txn.balanceAfter.toLocaleString(), colX.balance, y, { width: 80 });
    doc.moveDown(0.8);

    if (doc.y > 720) doc.addPage();
  });

  // Footer
  doc.moveDown();
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#1B3A6B');
  doc.moveDown(0.5);
  doc.fontSize(8).fillColor('#888').text('This is a system-generated statement. MiniBank © 2026', { align: 'center' });

  doc.end();
};

module.exports = generateStatement;
