import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function CustomerApplyLoan() {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ accountId: '', amount: '', purpose: '', tenureMonths: 12 });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/accounts/my').then(r => {
      const active = r.data.accounts.filter(a => a.status === 'active');
      setAccounts(active);
      if (active.length) setForm(f => ({ ...f, accountId: active[0]._id }));
    });
  }, []);

  // EMI preview
  const emiPreview = () => {
    if (!form.amount || !form.tenureMonths) return null;
    const r = 9 / 100 / 12; // default 9%
    const P = Number(form.amount);
    const n = Number(form.tenureMonths);
    const emi = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return { emi: emi.toFixed(2), total: (emi * n).toFixed(2) };
  };

  const preview = emiPreview();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await api.post('/loans', { ...form, amount: Number(form.amount), tenureMonths: Number(form.tenureMonths) });
      setMsg({ type: 'success', text: 'Loan application submitted successfully! Awaiting officer review.' });
      setTimeout(() => navigate('/customer/loans'), 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Application failed' });
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Apply for Loan" subtitle="Submit a new loan application">
      <div style={{ maxWidth: 600 }}>
        {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

        <div className="card">
          {accounts.length === 0 ? (
            <div className="alert alert-info">You need an active account to apply for a loan.</div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Disburse Loan To *</label>
                <select className="form-control" value={form.accountId} onChange={e => setForm({ ...form, accountId: e.target.value })}>
                  {accounts.map(a => <option key={a._id} value={a._id}>{a.accountNumber} — {a.type} — {fmtBDT(a.balance)}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Loan Amount (BDT) *</label>
                  <input className="form-control" type="number" min="1000" placeholder="Minimum BDT 1,000"
                    value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Tenure (Months) *</label>
                  <select className="form-control" value={form.tenureMonths} onChange={e => setForm({ ...form, tenureMonths: e.target.value })}>
                    {[3, 6, 12, 18, 24, 36, 48, 60].map(m => <option key={m} value={m}>{m} months</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Purpose / Reason *</label>
                <textarea className="form-control" rows={3} placeholder="Describe the purpose of the loan (e.g. Home renovation, Business expansion, Education)"
                  value={form.purpose} onChange={e => setForm({ ...form, purpose: e.target.value })} required />
              </div>

              {preview && (
                <div style={{ padding: 16, background: '#eff6ff', borderRadius: 8, marginBottom: 16, fontSize: '.88rem' }}>
                  <div style={{ fontWeight: 600, color: '#1e40af', marginBottom: 8 }}>📊 EMI Estimate (at 9% p.a.)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div><span style={{ color: '#666' }}>Monthly EMI:</span> <strong>{fmtBDT(preview.emi)}</strong></div>
                    <div><span style={{ color: '#666' }}>Total Repayable:</span> <strong>{fmtBDT(preview.total)}</strong></div>
                    <div><span style={{ color: '#666' }}>Tenure:</span> <strong>{form.tenureMonths} months</strong></div>
                    <div><span style={{ color: '#666' }}>Note:</span> <span style={{ color: '#888', fontSize: '.8rem' }}>Final rate set by officer</span></div>
                  </div>
                </div>
              )}

              <div style={{ padding: 12, background: '#fefce8', borderRadius: 6, fontSize: '.82rem', color: '#854d0e', marginBottom: 16 }}>
                ⚠️ Only one pending loan application is allowed at a time. The interest rate will be finalized by the bank officer.
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : '📋 Submit Application'}
                </button>
                <button className="btn btn-outline" type="button" onClick={() => navigate('/customer/loans')}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
