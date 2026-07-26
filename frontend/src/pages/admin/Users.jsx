import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [filter, setFilter] = useState({ role: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showCreateOfficer, setShowCreateOfficer] = useState(false);
  const [officerForm, setOfficerForm] = useState({ name: '', email: '', password: '', phone: '', branchId: '', employeeId: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(Object.fromEntries(Object.entries(filter).filter(([, v]) => v)));
      const [usersRes, brRes] = await Promise.all([
        api.get(`/admin/users?${params}`),
        api.get('/admin/branches'),
      ]);
      setUsers(usersRes.data.users);
      setBranches(brRes.data.branches);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const createOfficer = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      await api.post('/admin/users/officer', officerForm);
      setMsg({ type: 'success', text: 'Officer account created successfully!' });
      setShowCreateOfficer(false);
      setOfficerForm({ name: '', email: '', password: '', phone: '', branchId: '', employeeId: '' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to create officer' });
    } finally { setSubmitting(false); }
  };

  const toggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      setUsers(users.map(u => u._id === userId ? { ...u, status: newStatus } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const roleBadge = (r) => {
    const map = { admin: 'badge-danger', officer: 'badge-info', customer: 'badge-success' };
    return <span className={`badge ${map[r]}`}>{r}</span>;
  };
  const statusBadge = (s) => <span className={`badge ${s === 'active' ? 'badge-success' : 'badge-danger'}`}>{s}</span>;

  const set = k => e => setOfficerForm({ ...officerForm, [k]: e.target.value });

  return (
    <Layout title="Users & Officers" subtitle="Manage customers and bank officers">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <div className="card-title">Create Bank Officer</div>
          <button className="btn btn-primary" onClick={() => setShowCreateOfficer(!showCreateOfficer)}>
            {showCreateOfficer ? '✕ Cancel' : '+ Create Officer'}
          </button>
        </div>

        {showCreateOfficer && (
          <form onSubmit={createOfficer}>
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input className="form-control" value={officerForm.name} onChange={set('name')} required /></div>
              <div className="form-group"><label>Email *</label><input className="form-control" type="email" value={officerForm.email} onChange={set('email')} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Password *</label><input className="form-control" type="password" value={officerForm.password} onChange={set('password')} required /></div>
              <div className="form-group"><label>Phone</label><input className="form-control" value={officerForm.phone} onChange={set('phone')} /></div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Branch *</label>
                <select className="form-control" value={officerForm.branchId} onChange={set('branchId')} required>
                  <option value="">— Select Branch —</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name} ({b.branchCode})</option>)}
                </select>
              </div>
              <div className="form-group"><label>Employee ID</label><input className="form-control" placeholder="EMP001" value={officerForm.employeeId} onChange={set('employeeId')} /></div>
            </div>
            <button className="btn btn-success" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : '✓ Create Officer Account'}
            </button>
          </form>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">All Users ({users.length})</div>
        </div>

        <div className="filter-bar">
          <div className="form-group">
            <label>Role</label>
            <select className="form-control" value={filter.role} onChange={e => setFilter({ ...filter, role: e.target.value })}>
              <option value="">All Roles</option>
              <option value="customer">Customer</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select className="form-control" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div className="form-group">
            <label>Search</label>
            <input className="form-control" placeholder="Name or email..." value={filter.search}
              onChange={e => setFilter({ ...filter, search: e.target.value })} />
          </div>
          <button className="btn btn-primary" onClick={load}>🔍 Search</button>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Branch</th><th>Joined</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td style={{ fontWeight: 500 }}>{u.name}</td>
                    <td style={{ fontSize: '.85rem' }}>{u.email}</td>
                    <td>{roleBadge(u.role)}</td>
                    <td style={{ fontSize: '.82rem' }}>{u.phone || '—'}</td>
                    <td style={{ fontSize: '.82rem' }}>{u.branch?.name || '—'}</td>
                    <td style={{ fontSize: '.82rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td>
                      {u.role !== 'admin' && (
                        <button className={`btn btn-sm ${u.status === 'active' ? 'btn-warning' : 'btn-success'}`}
                          onClick={() => toggleStatus(u._id, u.status)}>
                          {u.status === 'active' ? '🔒 Suspend' : '✓ Activate'}
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
