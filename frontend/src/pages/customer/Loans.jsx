import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const statusBadge = (s) => {
  const map = { pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger', closed: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function CustomerLoans() {
  const [loans, setLoans] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/loans/my');
      setLoans(res.data.loans);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const payInstallment = async (loanId, installmentId) => {
    setPaying(installmentId); setMsg({ type: '', text: '' });
    try {
      const res = await api.put(`/loans/${loanId}/repay/${installmentId}`);
      setMsg({ type: 'success', text: 'Installment paid successfully!' });
      setSelected(res.data.loan);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Payment failed' });
    } finally { setPaying(null); }
  };

  return (
    <Layout title="My Loans" subtitle="View and manage your loan applications">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <Link to="/customer/loans/apply" className="btn btn-primary">+ Apply for Loan</Link>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : loans.length === 0 ? (
        <div className="card">
          <div className="empty">
            <div className="empty-icon">📋</div>
            <p>No loan applications yet.</p>
            <Link to="/customer/loans/apply" className="btn btn-primary" style={{ marginTop: 12 }}>Apply for a Loan</Link>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            {loans.map(loan => (
              <div key={loan._id} className="card" style={{ cursor: 'pointer', border: selected?._id === loan._id ? '2px solid #1B3A6B' : '1px solid #e2e8f0' }}
                onClick={() => setSelected(loan)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{fmtBDT(loan.amount)}</div>
                    <div style={{ fontSize: '.82rem', color: '#666' }}>{loan.purpose}</div>
                    <div style={{ fontSize: '.78rem', color: '#aaa', marginTop: 4 }}>
                      Ref: <code>{loan.loanRef}</code> • {new Date(loan.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {statusBadge(loan.status)}
                </div>
                {loan.status === 'approved' && (
                  <div style={{ marginTop: 10, fontSize: '.82rem' }}>
                    <span style={{ color: '#16a34a' }}>EMI: {fmtBDT(loan.monthlyInstallment)}/mo</span>
                    {' • '}
                    <span>{loan.tenureMonths} months</span>
                    {' • '}
                    <span>{loan.repaymentSchedule?.filter(i => i.paid).length}/{loan.tenureMonths} paid</span>
                  </div>
                )}
                {loan.status === 'rejected' && loan.rejectedReason && (
                  <div style={{ marginTop: 8, fontSize: '.8rem', color: '#991b1b' }}>Reason: {loan.rejectedReason}</div>
                )}
              </div>
            ))}
          </div>

          {/* Schedule Panel */}
          {selected && selected.status === 'approved' && (
            <div className="card">
              <div className="card-title" style={{ marginBottom: 16 }}>Repayment Schedule — {selected.loanRef}</div>
              <div style={{ marginBottom: 12, fontSize: '.85rem', color: '#666' }}>
                Rate: {selected.interestRate}% p.a. • Total Repayable: {fmtBDT(selected.totalRepayable)}
              </div>
              <div style={{ maxHeight: 440, overflowY: 'auto' }}>
                {selected.repaymentSchedule?.map(inst => (
                  <div key={inst._id} style={{
                    padding: '10px 0', borderBottom: '1px solid #f1f5f9',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    opacity: inst.paid ? 0.6 : 1,
                  }}>
                    <div>
                      <div style={{ fontSize: '.85rem', fontWeight: 500 }}>
                        #{inst.installmentNumber} — Due: {new Date(inst.dueDate).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '.8rem', color: '#666' }}>{fmtBDT(inst.amount)}</div>
                    </div>
                    {inst.paid ? (
                      <span className="badge badge-success">✓ Paid</span>
                    ) : (
                      <button className="btn btn-success btn-sm"
                        onClick={() => payInstallment(selected._id, inst._id)}
                        disabled={paying === inst._id}>
                        {paying === inst._id ? '...' : 'Pay'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected && selected.status !== 'approved' && (
            <div className="card">
              <div className="card-title">Loan Details</div>
              <div style={{ fontSize: '.88rem', marginTop: 12 }}>
                <table style={{ width: '100%' }}>
                  <tbody>
                    {[
                      ['Reference', selected.loanRef],
                      ['Amount', fmtBDT(selected.amount)],
                      ['Purpose', selected.purpose],
                      ['Tenure', `${selected.tenureMonths} months`],
                      ['Status', selected.status.toUpperCase()],
                      ['Applied On', new Date(selected.createdAt).toLocaleDateString()],
                      ...(selected.rejectedReason ? [['Rejection Reason', selected.rejectedReason]] : []),
                    ].map(([k, v]) => (
                      <tr key={k}><td style={{ padding: '6px 0', color: '#666', width: '40%' }}>{k}</td><td style={{ fontWeight: 500 }}>{v}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
