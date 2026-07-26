import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then(r => {
      setStats(r.data.stats);
      setChart(r.data.chart);
    }).finally(() => setLoading(false));
  }, []);

  const maxCount = Math.max(...chart.map(d => d.count), 1);

  return (
    <Layout title="Admin Dashboard" subtitle="System-wide overview and management">
      {loading ? <div className="loading"><div className="spinner" /></div> : (
        <>
          <div className="stats-grid">
            <div className="stat-card blue">
              <div className="stat-label">Total Customers</div>
              <div className="stat-value">{stats.totalCustomers}</div>
              <div className="stat-icon">👥</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Active Accounts</div>
              <div className="stat-value">{stats.totalAccounts}</div>
              <div className="stat-icon">🏦</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Pending Accounts</div>
              <div className="stat-value">{stats.pendingAccounts}</div>
              <div className="stat-icon">⏳</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Pending Loans</div>
              <div className="stat-value">{stats.pendingLoans}</div>
              <div className="stat-icon">📋</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Transactions Today</div>
              <div className="stat-value">{stats.totalTransactionsToday}</div>
              <div className="stat-icon">💳</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Active Loans</div>
              <div className="stat-value">{stats.activeLoans}</div>
              <div className="stat-icon">✅</div>
            </div>
          </div>

          {/* Bar chart */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📊 Transactions — Last 7 Days</div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 160, padding: '0 8px' }}>
              {chart.map(d => (
                <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{ fontSize: '.75rem', color: '#666' }}>{d.count}</div>
                  <div style={{
                    width: '100%', background: '#1B3A6B', borderRadius: '4px 4px 0 0',
                    height: `${Math.max((d.count / maxCount) * 120, d.count > 0 ? 8 : 2)}px`,
                    transition: 'height .3s',
                  }} />
                  <div style={{ fontSize: '.7rem', color: '#888', whiteSpace: 'nowrap' }}>
                    {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>⚡ Quick Actions</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
              {[
                { label: '+ Create Officer', to: '/admin/users', icon: '👮' },
                { label: '+ Add Branch', to: '/admin/branches', icon: '🏢' },
                { label: 'View Reports', to: '/admin/reports', icon: '📊' },
                { label: 'System Config', to: '/admin/config', icon: '⚙️' },
                { label: 'Audit Logs', to: '/admin/audit-logs', icon: '🔍' },
              ].map(({ label, to, icon }) => (
                <Link key={to} to={to} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px',
                  background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                  textDecoration: 'none', color: '#1B3A6B', fontWeight: 500, fontSize: '.9rem',
                  transition: 'background .15s',
                }}>
                  <span style={{ fontSize: '1.3rem' }}>{icon}</span> {label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
