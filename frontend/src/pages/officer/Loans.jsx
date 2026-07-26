import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const statusBadge = (s) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', closed: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function OfficerLoans() {
  const [loans, setLoans] = useState([]);
  const [filter, setFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [approveForm, setApproveForm] = useState({ interestRate: 9 });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/loans/all?status=${filter}`);
      setLoans(res.data.loans);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); setSelected(null); }, [filter]);

  const approveLoan = async () => {
    setProcessing(true); setMsg({ type: '', text: '' });
    try {
      await api.put(`/loans/${selected._id}/approve`, { interestRate: approveForm.interestRate });
      setMsg({ type: 'success', text: 'Loan approved and disbursed!' });
      setSelected(null); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to approve loan' });
    } finally { setProcessing(false); }
  };

  const rejectLoan = async () => {
    setProcessing(true); setMsg({ type: '', text: '' });
    try {
      await api.put(`/loans/${selected._id}/reject`, { reason: rejectReason });
      setMsg({ type: 'success', text: 'Loan application rejected.' });
      setSelected(null); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to reject loan' });
    } finally { setProcessing(false); }
  };

  // EMI preview
  const emiPreview = () => {
    if (!selected) return null;
    const r = approveForm.interestRate / 100 / 12;
    const P = selected.amount;
    const n = selected.tenureMonths;
    if (r === 0) return { emi: (P / n).toFixed(2), total: P.toFixed(2) };
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { emi: emi.toFixed(2), total: (emi * n).toFixed(2) };
  };
  const preview = emiPreview();

  return (
    <Layout title="Loan Applications" subtitle="Review and process customer loan requests">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="filter-bar" style={{ marginBottom: 16 }}>
        {['pending', 'approved', 'rejected', 'closed'].map(s => (
          <button key={s} className={`btn ${filter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(s)} style={{ textTransform: 'capitalize' }}>
            {s}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.1fr' : '1fr', gap: 20 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>
            {filter.charAt(0).toUpperCase() + filter.slice(1)} Applications ({loans.length})
          </div>

          {loading ? <div className="loading"><div className="spinner" /></div> : loans.length === 0 ? (
            <div className="empty"><div className="empty-icon">📋</div><p>No {filter} loan applications.</p></div>
          ) : loans.map(loan => (
            <div key={loan._id}
              style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9', cursor: 'pointer', background: selected?._id === loan._id ? '#f0f9ff' : '' }}
              onClick={() => { setSelected(loan); setApproveForm({ interestRate: 9 }); setRejectReason(''); }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{loan.customer?.name}</div>
                  <div style={{ fontSize: '.82rem', color: '#666' }}>{loan.customer?.email} • {loan.customer?.phone}</div>
                  <div style={{ fontSize: '.85rem', marginTop: 4 }}>
                    <strong>{fmtBDT(loan.amount)}</strong> • {loan.tenureMonths} months
                  </div>
                  <div style={{ fontSize: '.8rem', color: '#888' }}>{loan.purpose}</div>
                  <div style={{ fontSize: '.75rem', color: '#aaa', marginTop: 2 }}>{new Date(loan.createdAt).toLocaleDateString()}</div>
                </div>
                {statusBadge(loan.status)}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📋 Loan Review — {selected.loanRef}</div>

            <table style={{ width: '100%', fontSize: '.88rem', marginBottom: 20 }}>
              <tbody>
                {[
                  ['Customer', selected.customer?.name],
                  ['Email', selected.customer?.email],
                  ['Phone', selected.customer?.phone || '—'],
                  ['Account', selected.account?.accountNumber],
                  ['Loan Amount', fmtBDT(selected.amount)],
                  ['Purpose', selected.purpose],
                  ['Tenure', `${selected.tenureMonths} months`],
                  ['Applied On', new Date(selected.createdAt).toLocaleDateString()],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '7px 0', color: '#666', width: '40%' }}>{k}</td>
                    <td style={{ fontWeight: 500 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {selected.status === 'pending' && (
              <>
                <div style={{ padding: 14, background: '#f0f9ff', borderRadius: 8, marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, color: '#1B3A6B', marginBottom: 10 }}>Approval Decision</div>
                  <div className="form-group">
                    <label>Interest Rate (% per annum) *</label>
                    <input className="form-control" type="number" min="1" max="30" step="0.5"
                      value={approveForm.interestRate}
                      onChange={e => setApproveForm({ interestRate: e.target.value })} />
                  </div>
                  {preview && (
                    <div style={{ fontSize: '.83rem', color: '#555', marginTop: 8, padding: 10, background: '#fff', borderRadius: 6 }}>
                      <div>📊 <strong>EMI:</strong> {fmtBDT(preview.emi)}/month</div>
                      <div>💰 <strong>Total Repayable:</strong> {fmtBDT(preview.total)}</div>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                    <button className="btn btn-success" onClick={approveLoan} disabled={processing}>
                      {processing ? '...' : '✓ Approve & Disburse'}
                    </button>
                  </div>
                </div>

                <div style={{ padding: 14, background: '#fef2f2', borderRadius: 8 }}>
                  <div style={{ fontWeight: 600, color: '#991b1b', marginBottom: 10 }}>Reject Application</div>
                  <div className="form-group">
                    <label>Rejection Reason *</label>
                    <textarea className="form-control" rows={2} value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason..." />
                  </div>
                  <button className="btn btn-danger" onClick={rejectLoan} disabled={!rejectReason || processing}>
                    {processing ? '...' : '✕ Reject Application'}
                  </button>
                </div>
              </>
            )}

            {selected.status !== 'pending' && (
              <div style={{ fontSize: '.88rem', color: '#666' }}>
                {selected.status === 'approved' && (
                  <>
                    <div style={{ marginBottom: 6 }}>✅ <strong>Approved</strong> at {selected.interestRate}% p.a.</div>
                    <div>Monthly EMI: {fmtBDT(selected.monthlyInstallment)}</div>
                    <div>Installments paid: {selected.repaymentSchedule?.filter(i => i.paid).length} / {selected.tenureMonths}</div>
                  </>
                )}
                {selected.status === 'rejected' && <div>❌ Rejected: {selected.rejectedReason}</div>}
              </div>
            )}

            <button className="btn btn-outline btn-sm" style={{ marginTop: 16 }} onClick={() => setSelected(null)}>
              ← Close
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
