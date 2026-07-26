import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function CustomerTransactions() {
  const { accountId } = useParams();
  const [txns, setTxns] = useState([]);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ type: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [txnForm, setTxnForm] = useState({ amount: '', note: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const [txnRes, accRes] = await Promise.all([
        api.get(`/transactions/${accountId}?${params}`),
        api.get(`/accounts/${accountId}`),
      ]);
      setTxns(txnRes.data.transactions);
      setPages(txnRes.data.pages);
      setTotal(txnRes.data.total);
      setAccount(accRes.data.account);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const applyFilters = () => { setPage(1); load(1); };

  const doTransaction = async (type) => {
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      await api.post(`/transactions/${type}`, { accountId, amount: Number(txnForm.amount), note: txnForm.note });
      setMsg({ type: 'success', text: `${type.charAt(0).toUpperCase() + type.slice(1)} successful!` });
      setTxnForm({ amount: '', note: '' });
      setShowDepositForm(false); setShowWithdrawForm(false);
      load(1);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Transaction failed' });
    } finally { setSubmitting(false); }
  };

  const txnColor = (type) => {
    if (type === 'deposit' || type === 'transfer_in') return '#16a34a';
    return '#dc2626';
  };
  const txnSign = (type) => (type === 'deposit' || type === 'transfer_in') ? '+' : '-';

  const downloadStatement = async () => {
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const res = await api.get(`/accounts/${accountId}/statement?${params}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a'); a.href = url;
      a.download = `statement_${account?.accountNumber}.pdf`; a.click();
    } catch { alert('Failed to download'); }
  };

  return (
    <Layout title="Transaction History" subtitle={account ? `Account: ${account.accountNumber}` : ''}>
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      {account && (
        <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className="stat-card green">
            <div className="stat-label">Current Balance</div>
            <div className="stat-value" style={{ fontSize: '1.3rem' }}>{fmtBDT(account.balance)}</div>
          </div>
          <div className="stat-card blue">
            <div className="stat-label">Account Type</div>
            <div className="stat-value" style={{ fontSize: '1.1rem', textTransform: 'capitalize' }}>{account.type}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Transactions</div>
            <div className="stat-value">{total}</div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      {account?.status === 'active' && (
        <div className="card">
          <div className="card-title" style={{ marginBottom: 12 }}>Quick Actions</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="btn btn-success" onClick={() => { setShowDepositForm(!showDepositForm); setShowWithdrawForm(false); }}>
              💰 Deposit
            </button>
            <button className="btn btn-danger" onClick={() => { setShowWithdrawForm(!showWithdrawForm); setShowDepositForm(false); }}>
              💸 Withdraw
            </button>
            <button className="btn btn-gold" onClick={downloadStatement}>📄 Download PDF Statement</button>
          </div>

          {(showDepositForm || showWithdrawForm) && (
            <div style={{ marginTop: 16, padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: 12 }}>{showDepositForm ? 'Deposit Funds' : 'Withdraw Funds'}</h4>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (BDT) *</label>
                  <input className="form-control" type="number" min="1" placeholder="Enter amount"
                    value={txnForm.amount} onChange={e => setTxnForm({ ...txnForm, amount: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Note (Optional)</label>
                  <input className="form-control" placeholder="Optional note"
                    value={txnForm.note} onChange={e => setTxnForm({ ...txnForm, note: e.target.value })} />
                </div>
              </div>
              <button className={`btn ${showDepositForm ? 'btn-success' : 'btn-danger'}`}
                onClick={() => doTransaction(showDepositForm ? 'deposit' : 'withdraw')}
                disabled={submitting || !txnForm.amount}>
                {submitting ? 'Processing...' : (showDepositForm ? 'Confirm Deposit' : 'Confirm Withdrawal')}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Transactions</div>
        </div>

        {/* Filters */}
        <div className="filter-bar">
          <div className="form-group">
            <label>Type</label>
            <select className="form-control" value={filters.type} onChange={e => setFilters({ ...filters, type: e.target.value })}>
              <option value="">All Types</option>
              <option value="deposit">Deposit</option>
              <option value="withdrawal">Withdrawal</option>
              <option value="transfer_in">Transfer In</option>
              <option value="transfer_out">Transfer Out</option>
            </select>
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input className="form-control" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input className="form-control" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={applyFilters}>🔍 Filter</button>
          <button className="btn btn-outline" onClick={() => { setFilters({ type: '', from: '', to: '' }); load(1); }}>Clear</button>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : txns.length === 0 ? (
          <div className="empty"><div className="empty-icon">💳</div><p>No transactions found.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date & Time</th><th>Reference</th><th>Type</th><th>Note</th><th>Amount</th><th>Balance After</th></tr>
              </thead>
              <tbody>
                {txns.map(t => (
                  <tr key={t._id}>
                    <td style={{ fontSize: '.82rem' }}>{new Date(t.createdAt).toLocaleString()}</td>
                    <td><code style={{ fontSize: '.78rem' }}>{t.transactionRef}</code></td>
                    <td>
                      <span className="badge" style={{
                        background: t.type.includes('deposit') || t.type === 'transfer_in' ? '#dcfce7' : '#fee2e2',
                        color: t.type.includes('deposit') || t.type === 'transfer_in' ? '#166534' : '#991b1b',
                      }}>
                        {t.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '.82rem', color: '#666' }}>{t.note || '—'}</td>
                    <td style={{ fontWeight: 700, color: txnColor(t.type) }}>
                      {txnSign(t.type)} {fmtBDT(t.amount)}
                    </td>
                    <td style={{ fontWeight: 500 }}>{fmtBDT(t.balanceAfter)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
