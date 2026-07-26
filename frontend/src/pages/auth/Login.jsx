import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'officer') navigate('/officer');
      else navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🏦 MiniBank</h1>
          <p>Secure Online Banking System</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email Address</label>
            <input className="form-control" type="email" placeholder="your@email.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input className="form-control" type="password" placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </div>

        <div style={{ marginTop: 20, padding: 12, background: '#f8fafc', borderRadius: 6, fontSize: '.78rem', color: '#666' }}>
          <strong>Demo Accounts:</strong><br />
          Admin: admin@minibank.com / Admin@1234<br />
          Officer: officer@minibank.com / Officer@1234<br />
          Customer: customer@minibank.com / Customer@1234
        </div>
      </div>
    </div>
  );
}
