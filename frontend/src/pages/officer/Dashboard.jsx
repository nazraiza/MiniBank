import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [pendingAccounts, setPendingAccounts] = useState([]);
  const [pendingLoans, setPendingLoans] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/accounts/pending'),
      api.get('/loans/all?status=pending'),
      api.get('/transactions/all?limit=5'),
    ]).then(([accRes, loanRes, txnRes]) => {
      setPendingAccounts(accRes.data.accounts);
      setPendingLoans(loanRes.data.loans);
      setRecentTxns(txnRes.data.transactions);
    }).finally(() => setLoading(false));
  }, []);

  return (
    <Layout title={`Officer Dashboard`} subtitle={`Welcome, ${user?.name}`}>
      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card red">
              <div className="stat-label">Pending Accounts</div>
              <div className="stat-value">{pendingAccounts.length}</div>
              <div className="stat-icon">🏦</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Pending Loans</div>
              <div className="stat-value">{pendingLoans.length}</div>
              <div className="stat-icon">📋</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Recent Transactions</div>
              <div className="stat-value">{recentTxns.length}</div>
              <div className="stat-icon">💳</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">⏳ Pending Account Requests</div>
                <Link to="/officer/accounts" className="btn btn-outline btn-sm">View All</Link>
              </div>
              {pendingAccounts.length === 0 ? (
                <div className="empty"><div className="empty-icon">✅</div><p>No pending requests</p></div>
              ) : pendingAccounts.slice(0, 4).map(acc => (
                <div key={acc._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 500 }}>{acc.customer?.name}</div>
                  <div style={{ fontSize: '.8rem', color: '#666' }}>
                    {acc.type} • Initial: {fmtBDT(acc.initialDeposit)} • {acc.branch?.name}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#aaa' }}>{new Date(acc.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">⏳ Pending Loan Applications</div>
                <Link to="/officer/loans" className="btn btn-outline btn-sm">View All</Link>
              </div>
              {pendingLoans.length === 0 ? (
                <div className="empty"><div className="empty-icon">✅</div><p>No pending loan applications</p></div>
              ) : pendingLoans.slice(0, 4).map(loan => (
                <div key={loan._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 500 }}>{loan.customer?.name}</div>
                  <div style={{ fontSize: '.8rem', color: '#666' }}>
                    {fmtBDT(loan.amount)} • {loan.tenureMonths} months • {loan.purpose}
                  </div>
                  <div style={{ fontSize: '.75rem', color: '#aaa' }}>{new Date(loan.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">Recent Transactions</div>
              <Link to="/officer/transactions" className="btn btn-outline btn-sm">View All</Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Date</th><th>Account</th><th>Type</th><th>Amount</th></tr></thead>
                <tbody>
                  {recentTxns.map(t => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td><span className="acc-number">{t.account?.accountNumber}</span></td>
                      <td><span className="badge badge-info">{t.type.replace('_', ' ')}</span></td>
                      <td style={{ fontWeight: 600 }}>{fmtBDT(t.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
