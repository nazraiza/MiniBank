import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: '', from: '', to: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: 25, ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) });
      const res = await api.get(`/admin/audit-logs?${params}`);
      setLogs(res.data.logs);
      setPages(res.data.pages);
      setTotal(res.data.total);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(page); }, [page]);

  const roleBadge = (r) => {
    const map = { admin: 'badge-danger', officer: 'badge-info', customer: 'badge-success' };
    return r ? <span className={`badge ${map[r] || 'badge-gray'}`}>{r}</span> : null;
  };

  const actionColor = (a) => {
    if (a.includes('APPROVE') || a.includes('PAY') || a.includes('CREATE')) return '#16a34a';
    if (a.includes('REJECT') || a.includes('SUSPEND') || a.includes('FREEZE')) return '#dc2626';
    return '#374151';
  };

  return (
    <Layout title="Audit Logs" subtitle="Track all critical system actions">
      <div className="card">
        <div className="card-header">
          <div className="card-title">🔍 System Activity Log ({total} records)</div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label>Action Filter</label>
            <input className="form-control" placeholder="e.g. LOGIN, TRANSFER" value={filters.action}
              onChange={e => setFilters({ ...filters, action: e.target.value })} />
          </div>
          <div className="form-group">
            <label>From Date</label>
            <input className="form-control" type="date" value={filters.from} onChange={e => setFilters({ ...filters, from: e.target.value })} />
          </div>
          <div className="form-group">
            <label>To Date</label>
            <input className="form-control" type="date" value={filters.to} onChange={e => setFilters({ ...filters, to: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={() => { setPage(1); load(1); }}>🔍 Filter</button>
          <button className="btn btn-outline" onClick={() => { setFilters({ action: '', from: '', to: '' }); load(1); }}>Clear</button>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : logs.length === 0 ? (
          <div className="empty"><div className="empty-icon">🔍</div><p>No audit logs found.</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date & Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Details</th><th>IP</th></tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log._id}>
                    <td style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: '.85rem' }}>{log.user?.name}</div>
                      <div style={{ fontSize: '.75rem', color: '#888' }}>{log.user?.email}</div>
                    </td>
                    <td>{roleBadge(log.user?.role)}</td>
                    <td style={{ fontWeight: 600, fontSize: '.82rem', color: actionColor(log.action) }}>{log.action}</td>
                    <td style={{ fontSize: '.78rem', color: '#666' }}>{log.entityType || '—'}</td>
                    <td style={{ fontSize: '.78rem', color: '#666', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.details || '—'}</td>
                    <td style={{ fontSize: '.75rem', color: '#aaa' }}>{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="pagination">
            <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
            {Array.from({ length: Math.min(pages, 7) }, (_, i) => i + 1).map(p => (
              <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            ))}
            <button className="page-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </div>
    </Layout>
  );
}
