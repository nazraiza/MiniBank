import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function OfficerTransactions() {
  const [txns, setTxns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [depositForm, setDepositForm] = useState({ accountNumber: '', amount: '', note: '', type: 'deposit' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 20, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/transactions/all?${params}`);
      setTxns(res.data.transactions);
      setPages(res.data.pages);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const processTransaction = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      // Lookup account by number
      const accRes = await api.get(`/accounts/all?search=${depositForm.accountNumber}`);
      const account = accRes.data.accounts.find(a => a.accountNumber === depositForm.accountNumber);
      if (!account) throw new Error('Account not found');

      await api.post(`/transactions/${depositForm.type}`, {
        accountId: account._id,
        amount: Number(depositForm.amount),
        note: depositForm.note,
      });
      setMsg({ type: 'success', text: `${depositForm.type.charAt(0).toUpperCase() + depositForm.type.slice(1)} of ${fmtBDT(depositForm.amount)} processed successfully!` });
      setDepositForm({ accountNumber: '', amount: '', note: '', type: 'deposit' });
      load(1);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message || 'Transaction failed' });
    } finally { setSubmitting(false); }
  };

  const txnColor = (type) => (type === 'deposit' || type === 'transfer_in') ? '#16a34a' : '#dc2626';
  const txnSign = (type) => (type === 'deposit' || type === 'transfer_in') ? '+' : '-';

  return (
    <Layout title="Transactions" subtitle="Process over-the-counter transactions and view history">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      {/* OTC Transaction */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>💼 Process Counter Transaction</div>
        <form onSubmit={processTransaction}>
          <div className="form-row">
            <div className="form-group">
              <label>Transaction Type *</label>
              <select className="form-control" value={depositForm.type}
                onChange={e => setDepositForm({ ...depositForm, type: e.target.value })}>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdrawal</option>
              </select>
            </div>
            <div className="form-group">
              <label>Account Number *</label>
              <input className="form-control" placeholder="e.g. MB123456789"
                value={depositForm.accountNumber} onChange={e => setDepositForm({ ...depositForm, accountNumber: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Amount (BDT) *</label>
              <input className="form-control" type="number" min="1" placeholder="Enter amount"
                value={depositForm.amount} onChange={e => setDepositForm({ ...depositForm, amount: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Note</label>
              <input className="form-control" placeholder="Optional note"
                value={depositForm.note} onChange={e => setDepositForm({ ...depositForm, note: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Processing...' : '✓ Process Transaction'}
          </button>
        </form>
      </div>

      {/* History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">Transaction History</div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label>Type</label>
            <select className="form-control" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
            </select>
          </div>
          <div className="form-group">
            <label>From</label>
            <input className="form-control" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To</label>
            <input className="form-control" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(1); load(1); }}>🔍 Filter</button>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Reference</th><th>Account</th><th>Type</th><th>Amount</th><th>Balance After</th><th>Note</th></tr></thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontSize: '.82rem' }}>{new Date(t.createdAt).toLocaleString()}</td>
                    <td><code style={{ fontSize: '.75rem' }}>{t.transactionRef}</code></td>
                    <td><span className="acc-number" style={{ fontSize: '.85rem' }}>{t.account?.accountNumber}</span></td>
                    <td><span className="badge badge-info">{t.type.replace('_', ' ')}</span></td>
                    <td style={{ fontWeight: 700, color: txnColor(t.type) }}>{txnSign(t.type)} {fmtBDT(t.amount)}</td>
                    <td>{fmtBDT(t.balanceAfter)}</td>
                    <td style={{ fontSize: '.8rem', color: '#666' }}>{t.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
