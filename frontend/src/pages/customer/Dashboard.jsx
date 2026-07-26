import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;
const statusBadge = (s) => {
  const map = { active: 'badge-success', pending: 'badge-warning', frozen: 'badge-info', closed: 'badge-gray' };
  return <span className={`badge ${map[s] || 'badge-gray'}`}>{s}</span>;
};

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState([]);
  const [loans, setLoans] = useState([]);
  const [recentTxns, setRecentTxns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [accRes, loanRes] = await Promise.all([
          api.get('/accounts/my'),
          api.get('/loans/my'),
        ]);
        setAccounts(accRes.data.accounts);
        setLoans(loanRes.data.loans);

        // Get recent txns from first active account
        const active = accRes.data.accounts.find(a => a.status === 'active');
        if (active) {
          const txnRes = await api.get(`/transactions/${active._id}?limit=5`);
          setRecentTxns(txnRes.data.transactions);
        }
      } catch { /* ignore */ } finally { setLoading(false); }
    };
    load();
  }, []);

  const totalBalance = accounts.filter(a => a.status === 'active').reduce((s, a) => s + a.balance, 0);
  const activeLoans = loans.filter(l => l.status === 'approved');

  const txnClass = (type) => {
    if (type === 'deposit' || type === 'transfer_in') return 'txn-deposit';
    return type === 'withdrawal' ? 'txn-withdrawal' : 'txn-transfer';
  };
  const txnSign = (type) => (type === 'deposit' || type === 'transfer_in') ? '+' : '-';

  return (
    <Layout title={`Welcome, ${user?.name?.split(' ')[0]}! 👋`} subtitle="Here's your financial overview">
      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <>
          {/* Stats */}
          <div className="stats-grid">
            <div className="stat-card green">
              <div className="stat-label">Total Balance</div>
              <div className="stat-value" style={{ fontSize: '1.4rem' }}>{fmtBDT(totalBalance)}</div>
              <div style={{ fontSize: '.78rem', color: '#666', marginTop: 4 }}>Across {accounts.filter(a => a.status === 'active').length} active account(s)</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Accounts</div>
              <div className="stat-value">{accounts.length}</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Active Loans</div>
              <div className="stat-value">{activeLoans.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Pending</div>
              <div className="stat-value">{accounts.filter(a => a.status === 'pending').length}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* My Accounts */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">My Accounts</div>
                <Link to="/customer/accounts" className="btn btn-outline btn-sm">Manage</Link>
              </div>
              {accounts.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">🏦</div>
                  <p>No accounts yet.</p>
                  <Link to="/customer/accounts" className="btn btn-primary" style={{ marginTop: 12 }}>Open Account</Link>
                </div>
              ) : accounts.map(acc => (
                <div key={acc._id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="acc-number">{acc.accountNumber}</div>
                    <div style={{ fontSize: '.8rem', color: '#666', textTransform: 'capitalize' }}>{acc.type} • {acc.branch?.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#16a34a' }}>{fmtBDT(acc.balance)}</div>
                    {statusBadge(acc.status)}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent Transactions */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Transactions</div>
                {accounts.find(a => a.status === 'active') &&
                  <Link to={`/customer/transactions/${accounts.find(a => a.status === 'active')?._id}`} className="btn btn-outline btn-sm">View All</Link>}
              </div>
              {recentTxns.length === 0 ? (
                <div className="empty"><div className="empty-icon">💳</div><p>No transactions yet.</p></div>
              ) : recentTxns.map(t => (
                <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '.85rem', fontWeight: 500 }}>{t.type.replace('_', ' ').toUpperCase()}</div>
                    <div style={{ fontSize: '.75rem', color: '#888' }}>{new Date(t.createdAt).toLocaleDateString()}</div>
                    {t.note && <div style={{ fontSize: '.75rem', color: '#aaa' }}>{t.note}</div>}
                  </div>
                  <div className={txnClass(t.type)} style={{ fontWeight: 700 }}>
                    {txnSign(t.type)} {fmtBDT(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loans */}
          {loans.length > 0 && (
            <div className="card" style={{ marginTop: 0 }}>
              <div className="card-header">
                <div className="card-title">My Loans</div>
                <Link to="/customer/loans" className="btn btn-outline btn-sm">View All</Link>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Ref</th><th>Amount</th><th>Purpose</th><th>EMI</th><th>Status</th></tr></thead>
                  <tbody>
                    {loans.slice(0, 3).map(l => (
                      <tr key={l._id}>
                        <td><code>{l.loanRef}</code></td>
                        <td>{fmtBDT(l.amount)}</td>
                        <td>{l.purpose}</td>
                        <td>{l.monthlyInstallment ? fmtBDT(l.monthlyInstallment) : '—'}</td>
                        <td>{statusBadge(l.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div className="card" style={{ marginTop: 0 }}>
            <div className="card-title" style={{ marginBottom: 16 }}>Quick Actions</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/customer/transfer" className="btn btn-primary">💸 Transfer Funds</Link>
              <Link to="/customer/accounts" className="btn btn-outline">🏦 Open Account</Link>
              <Link to="/customer/loans/apply" className="btn btn-gold">📋 Apply for Loan</Link>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
