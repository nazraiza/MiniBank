import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

const fmtBDT = (n) => `BDT ${Number(n).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`;

export default function AdminReports() {
  const [report, setReport] = useState(null);
  const [filters, setFilters] = useState({ from: '', to: '' });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([, v]) => v)));
      const res = await api.get(`/admin/reports?${params}`);
      setReport(res.data.report);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <Layout title="Reports" subtitle="Financial summary and analytics">
      <div className="filter-bar" style={{ marginBottom: 20 }}>
        <div className="form-group">
          <label>From Date</label>
          <input className="form-control" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
        </div>
        <div className="form-group">
          <label>To Date</label>
          <input className="form-control" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
        </div>
        <button className="btn btn-primary" onClick={load}>📊 Generate Report</button>
        <button className="btn btn-outline" onClick={() => { setFilters({ from: '', to: '' }); load(); }}>Clear</button>
      </div>

      {loading ? <div className="loading"><div className="spinner" /></div> : report && (
        <>
          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card green">
              <div className="stat-label">Total Deposits</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmtBDT(report.deposits.total)}</div>
              <div style={{ fontSize: '.8rem', color: '#666', marginTop: 4 }}>{report.deposits.count} transactions</div>
            </div>
            <div className="stat-card red">
              <div className="stat-label">Total Withdrawals</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmtBDT(report.withdrawals.total)}</div>
              <div style={{ fontSize: '.8rem', color: '#666', marginTop: 4 }}>{report.withdrawals.count} transactions</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-label">Total Transfers</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmtBDT(report.transfers.total)}</div>
              <div style={{ fontSize: '.8rem', color: '#666', marginTop: 4 }}>{report.transfers.count} transactions</div>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-label">New Accounts</div>
              <div className="stat-value">{report.newAccounts}</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Loan Applications</div>
              <div className="stat-value">{report.newLoans}</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Loans Disbursed</div>
              <div className="stat-value" style={{ fontSize: '1.2rem' }}>{fmtBDT(report.loanDisbursed)}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-title" style={{ marginBottom: 16 }}>📊 Summary Table</div>
            <table>
              <thead><tr><th>Category</th><th>Count</th><th>Total Amount</th></tr></thead>
              <tbody>
                <tr><td>Deposits</td><td>{report.deposits.count}</td><td style={{ color: '#16a34a', fontWeight: 600 }}>{fmtBDT(report.deposits.total)}</td></tr>
                <tr><td>Withdrawals</td><td>{report.withdrawals.count}</td><td style={{ color: '#dc2626', fontWeight: 600 }}>{fmtBDT(report.withdrawals.total)}</td></tr>
                <tr><td>Fund Transfers</td><td>{report.transfers.count}</td><td style={{ color: '#2563eb', fontWeight: 600 }}>{fmtBDT(report.transfers.total)}</td></tr>
                <tr><td>New Accounts Opened</td><td>{report.newAccounts}</td><td>—</td></tr>
                <tr><td>Loan Applications</td><td>{report.newLoans}</td><td>—</td></tr>
                <tr><td>Loans Disbursed</td><td>—</td><td style={{ color: '#16a34a', fontWeight: 600 }}>{fmtBDT(report.loanDisbursed)}</td></tr>
                <tr style={{ fontWeight: 700, background: '#f8fafc' }}>
                  <td>Net Position (Deposits − Withdrawals)</td>
                  <td>—</td>
                  <td style={{ color: report.deposits.total - report.withdrawals.total >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700 }}>
                    {fmtBDT(report.deposits.total - report.withdrawals.total)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      )}
    </Layout>
  );
}
