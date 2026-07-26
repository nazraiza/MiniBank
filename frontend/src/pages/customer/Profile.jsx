import { useState } from 'react';
import Layout from '../../components/common/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

export default function CustomerProfile() {
  const { user } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return setMsg({ type: 'error', text: 'New passwords do not match' });
    }
    setLoading(true); setMsg({ type: '', text: '' });
    try {
      await api.put('/auth/password', { currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    } finally { setLoading(false); }
  };

  return (
    <Layout title="My Profile" subtitle="View your account information">
      <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>👤 Personal Information</div>
          <table style={{ width: '100%', fontSize: '.9rem' }}>
            <tbody>
              {[
                ['Full Name', user?.name],
                ['Email Address', user?.email],
                ['Phone', user?.phone || '—'],
                ['NID Number', user?.nidNumber || '—'],
                ['Address', user?.address || '—'],
                ['Account Role', user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)],
                ['Status', <span className="badge badge-success">Active</span>],
                ['Member Since', new Date(user?.createdAt).toLocaleDateString()],
              ].map(([k, v]) => (
                <tr key={k} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 0', color: '#666', width: '40%', fontWeight: 500 }}>{k}</td>
                  <td style={{ padding: '10px 0' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>🔒 Change Password</div>
          {msg.text && <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>{msg.text}</div>}
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password *</label>
              <input className="form-control" type="password" value={form.currentPassword}
                onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>New Password *</label>
              <input className="form-control" type="password" value={form.newPassword}
                onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Confirm New Password *</label>
              <input className="form-control" type="password" value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Updating...' : '🔒 Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
