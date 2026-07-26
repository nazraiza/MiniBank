// Admin Branches page
import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

export default function AdminBranches() {
  const [branches, setBranches] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', city: '', phone: '', managerName: '', branchCode: '' });
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const res = await api.get('/admin/branches');
    setBranches(res.data.branches);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setMsg({ type: '', text: '' });
    try {
      if (editId) {
        await api.put(`/admin/branches/${editId}`, form);
        setMsg({ type: 'success', text: 'Branch updated!' });
      } else {
        await api.post('/admin/branches', form);
        setMsg({ type: 'success', text: 'Branch created!' });
      }
      setShowForm(false); setEditId(null);
      setForm({ name: '', address: '', city: '', phone: '', managerName: '', branchCode: '' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    } finally { setSubmitting(false); }
  };

  const startEdit = (b) => {
    setForm({ name: b.name, address: b.address, city: b.city, phone: b.phone || '', managerName: b.managerName || '', branchCode: b.branchCode });
    setEditId(b._id); setShowForm(true);
  };

  const set = k => e => setForm({ ...form, [k]: e.target.value });

  return (
    <Layout title="Branch Management" subtitle="Manage bank branches">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">Branches ({branches.length})</div>
          <button className="btn btn-primary" onClick={() => { setShowForm(!showForm); setEditId(null); setForm({ name: '', address: '', city: '', phone: '', managerName: '', branchCode: '' }); }}>
            {showForm ? '✕ Cancel' : '+ Add Branch'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{ background: '#f8fafc', padding: 20, borderRadius: 8, marginBottom: 20, border: '1px solid #e2e8f0' }}>
            <h3 style={{ marginBottom: 16, color: '#1B3A6B' }}>{editId ? 'Edit Branch' : 'New Branch'}</h3>
            <div className="form-row">
              <div className="form-group"><label>Branch Name *</label><input className="form-control" value={form.name} onChange={set('name')} required /></div>
              <div className="form-group"><label>Branch Code *</label><input className="form-control" placeholder="HQ001" value={form.branchCode} onChange={set('branchCode')} required /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>City *</label><input className="form-control" value={form.city} onChange={set('city')} required /></div>
              <div className="form-group"><label>Phone</label><input className="form-control" value={form.phone} onChange={set('phone')} /></div>
            </div>
            <div className="form-group"><label>Address *</label><input className="form-control" value={form.address} onChange={set('address')} required /></div>
            <div className="form-group"><label>Manager Name</label><input className="form-control" value={form.managerName} onChange={set('managerName')} /></div>
            <button className="btn btn-success" type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : (editId ? '✓ Update Branch' : '✓ Create Branch')}
            </button>
          </form>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Branch Name</th><th>Code</th><th>City</th><th>Address</th><th>Manager</th><th>Phone</th><th>Actions</th></tr></thead>
            <tbody>
              {branches.map(b => (
                <tr key={b._id}>
                  <td style={{ fontWeight: 500 }}>{b.name}</td>
                  <td><code>{b.branchCode}</code></td>
                  <td>{b.city}</td>
                  <td style={{ fontSize: '.82rem' }}>{b.address}</td>
                  <td style={{ fontSize: '.82rem' }}>{b.managerName || '—'}</td>
                  <td style={{ fontSize: '.82rem' }}>{b.phone || '—'}</td>
                  <td><button className="btn btn-outline btn-sm" onClick={() => startEdit(b)}>✏️ Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
