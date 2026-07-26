import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const statusBadge = (s) => {
  const map = { active: 'badge-success', pending: 'badge-warning', frozen: 'badge-info', closed: 'badge-danger' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function CustomerAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'savings', initialDeposit: '', branchId: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [accRes, brRes] = await Promise.all([api.get('/accounts/my'), api.get('/admin/branches')]);
      setAccounts(accRes.data.accounts);
      setBranches(brRes.data.branches);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      await api.post('/accounts', form);
      setMsg({ type: 'success', text: 'Account opening request submitted! Awaiting officer approval.' });
      setShowForm(false);
      setForm({ type: 'savings', initialDeposit: '', branchId: '' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to submit request' });
    } finally { setSubmitting(false); }
  };

  const downloadStatement = async (accId, accNumber) => {
    try {
      const res = await api.get(`/accounts/${accId}/statement`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `statement_${accNumber}.pdf`; a.click();
    } catch { alert('Failed to download statement'); }
  };

  return (
    <Layout title="My Accounts" subtitle="Manage your bank accounts">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Accounts ({accounts.length})</div>
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? '✕ Cancel' : '+ Open New Account'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleOpen} style={{ background: '#f8fafc', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: 16, color: '#1B3A6B' }}>Open New Account</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Account Type *</label>
                <select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  <option value="savings">Savings Account</option>
                  <option value="current">Current Account</option>
                </select>
              </div>
              <div className="form-group">
                <label>Initial Deposit (BDT) *</label>
                <input className="form-control" type="number" min="500" placeholder="Minimum BDT 500"
                  value={form.initialDeposit} onChange={e => setForm({ ...form, initialDeposit: e.target.value })} required />
              </div>
            </div>
            <div className="form-group">
              <label>Branch *</label>
              <select className="form-control" value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} required>
                <option value="">— Select Branch —</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name} — {b.city} ({b.branchCode})</option>)}
              </select>
            </div>
            <button className="btn btn-success" type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : '✓ Submit Request'}
            </button>
          </form>
        )}

        {loading ? <div className="loading"><div className="spinner" /></div> : accounts.length === 0 ? (
          <div className="empty"><div className="empty-icon">🏦</div><p>No accounts found. Open your first account above.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Account Number</th><th>Type</th><th>Branch</th><th>Balance</th><th>Status</th><th>Opened</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc._id}>
                    <td><span className="acc-number">{acc.accountNumber}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{acc.type}</td>
                    <td>{acc.branch?.name}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>{fmtBDT(acc.balance)}</td>
                    <td>{statusBadge(acc.status)}</td>
                    <td>{new Date(acc.createdAt).toLocaleDateString()}</td>
                    <td style={{ display: 'flex', gap: 6 }}>
                      {acc.status === 'active' && (
                        <button className="btn btn-outline btn-sm" onClick={() => downloadStatement(acc._id, acc.accountNumber)}>
                          📄 Statement
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
