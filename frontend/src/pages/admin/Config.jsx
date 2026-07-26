import { useEffect, useState } from 'react';
import Layout from '../../components/common/Layout';
import api from '../../utils/api';

export default function AdminConfig() {
  const [configs, setConfigs] = useState([]);
  const [editKey, setEditKey] = useState(null);
  const [editVal, setEditVal] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [newForm, setNewForm] = useState({ key: '', value: '', description: '' });
  const [showNew, setShowNew] = useState(false);

  const load = async () => {
    const res = await api.get('/admin/config');
    setConfigs(res.data.configs);
  };
  useEffect(() => { load(); }, []);

  const save = async (key, description) => {
    try {
      await api.post('/admin/config', { key, value: editVal, description });
      setMsg({ type: 'success', text: `Config "${key}" updated.` });
      setEditKey(null); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update' });
    }
  };

  const saveNew = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/config', newForm);
      setMsg({ type: 'success', text: 'Config created!' });
      setShowNew(false); setNewForm({ key: '', value: '', description: '' }); load();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed' });
    }
  };

  return (
    <Layout title="System Configuration" subtitle="Manage interest rates and system-wide settings">
      {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">⚙️ Configuration Keys ({configs.length})</div>
          <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
            {showNew ? '✕ Cancel' : '+ Add Config'}
          </button>
        </div>

        {showNew && (
          <form onSubmit={saveNew} style={{ background: '#f8fafc', padding: 16, borderRadius: 8, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <div className="form-row-3">
              <div className="form-group"><label>Key *</label><input className="form-control" placeholder="e.g. max_withdrawal" value={newForm.key} onChange={e => setNewForm({ ...newForm, key: e.target.value })} required /></div>
              <div className="form-group"><label>Value *</label><input className="form-control" value={newForm.value} onChange={e => setNewForm({ ...newForm, value: e.target.value })} required /></div>
              <div className="form-group"><label>Description</label><input className="form-control" value={newForm.description} onChange={e => setNewForm({ ...newForm, description: e.target.value })} /></div>
            </div>
            <button className="btn btn-success" type="submit">✓ Save Config</button>
          </form>
        )}

        <div className="table-wrap">
          <table>
            <thead><tr><th>Key</th><th>Value</th><th>Description</th><th>Last Updated</th><th>Action</th></tr></thead>
            <tbody>
              {configs.map(c => (
                <tr key={c._id}>
                  <td><code style={{ color: '#1B3A6B', fontWeight: 600 }}>{c.key}</code></td>
                  <td>
                    {editKey === c.key ? (
                      <input className="form-control" style={{ width: 120, padding: '4px 8px' }}
                        value={editVal} onChange={e => setEditVal(e.target.value)} />
                    ) : (
                      <strong>{String(c.value)}</strong>
                    )}
                  </td>
                  <td style={{ fontSize: '.82rem', color: '#666' }}>{c.description || '—'}</td>
                  <td style={{ fontSize: '.78rem', color: '#aaa' }}>{new Date(c.updatedAt).toLocaleDateString()}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    {editKey === c.key ? (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => save(c.key, c.description)}>✓ Save</button>
                        <button className="btn btn-outline btn-sm" onClick={() => setEditKey(null)}>Cancel</button>
                      </>
                    ) : (
                      <button className="btn btn-outline btn-sm" onClick={() => { setEditKey(c.key); setEditVal(String(c.value)); }}>✏️ Edit</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
