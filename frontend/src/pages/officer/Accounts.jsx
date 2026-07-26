import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function OfficerAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [processing, setProcessing] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/accounts/all?status=${filter}`);
      setAccounts(res.data.accounts);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter]);

  const approve = async (id) => {
    setProcessing(id); setMsg({ type: '', text: '' });
    try {
      await api.put(`/accounts/${id}/approve`);
      setMsg({ type: 'success', text: 'Account approved and activated!' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to approve' });
    } finally { setProcessing(null); }
  };

  const reject = async () => {
    setProcessing(rejectModal);
    try {
      await api.put(`/accounts/${rejectModal}/reject`, { reason: rejectReason });
      setMsg({ type: 'success', text: 'Account request rejected.' });
      setRejectModal(null); setRejectReason('');
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reject' });
    } finally { setProcessing(null); }
  };

  const statusBadge = (s) => {
    const map = { active: 'badge-success', pending: 'badge-warning', frozen: 'badge-info', closed: 'badge-danger' };
    return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
  };

  return (
    <Layout title="Account Requests" subtitle="Review and manage customer account applications">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {['pending', 'active', 'closed'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>
          {filter.charAt(0).toUpperCase() + filter.slice(1)} Accounts ({accounts.length})
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : accounts.length === 0 ? (
          <div className="empty"><div className="empty-icon">📂</div><p>No {filter} accounts found.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Customer</th><th>Account #</th><th>Type</th><th>Initial Deposit</th><th>Balance</th><th>Branch</th><th>Date</th><th>Status</th>
                  {filter === 'pending' && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {accounts.map(acc => (
                  <tr key={acc._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{acc.customer?.name}</div>
                      <div style={{ fontSize: '.78rem', color: '#888' }}>{acc.customer?.email}</div>
                      {acc.customer?.phone && <div style={{ fontSize: '.75rem', color: '#aaa' }}>{acc.customer?.phone}</div>}
                    </td>
                    <td><span className="acc-number">{acc.accountNumber || '—'}</span></td>
                    <td style={{ textTransform: 'capitalize' }}>{acc.type}</td>
                    <td>{fmtBDT(acc.initialDeposit)}</td>
                    <td style={{ fontWeight: 600, color: '#16a34a' }}>{fmtBDT(acc.balance)}</td>
                    <td>{acc.branch?.name}</td>
                    <td style={{ fontSize: '.82rem' }}>{new Date(acc.createdAt).toLocaleDateString()}</td>
                    <td>{statusBadge(acc.status)}</td>
                    {filter === 'pending' && (
                      <td style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-success btn-sm"
                          onClick={() => approve(acc._id)} disabled={processing === acc._id}>
                          {processing === acc._id ? '...' : '✓ Approve'}
                        </button>
                        <button className="btn btn-danger btn-sm"
                          onClick={() => { setRejectModal(acc._id); setRejectReason(''); }}>
                          ✕ Reject
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div className="modal-title">Reject Account Request</div>
              <button className="modal-close" onClick={() => setRejectModal(null)}>×</button>
            </div>
            <div className="form-group">
              <label>Reason for Rejection *</label>
              <textarea className="form-control" rows={3} placeholder="Provide a reason for the customer..."
                value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-danger" onClick={reject} disabled={!rejectReason || processing}>
                {processing ? 'Rejecting...' : 'Confirm Reject'}
              </button>
              <button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
