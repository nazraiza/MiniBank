import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', nidNumber: '', address: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form);
      navigate('/customer');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <h1>🏦 MiniBank</h1>
          <p>Create your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input className="form-control" value={form.name} onChange={set('name')} required placeholder="Rahim Uddin" />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input className="form-control" value={form.phone} onChange={set('phone')} placeholder="01XXXXXXXXX" />
            </div>
          </div>
          <div className="form-group">
            <label>Email Address *</label>
            <input className="form-control" type="email" value={form.email} onChange={set('email')} required placeholder="your@email.com" />
          </div>
          <div className="form-group">
            <label>Password *</label>
            <input className="form-control" type="password" value={form.password} onChange={set('password')} required placeholder="Min. 6 characters" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>NID Number</label>
              <input className="form-control" value={form.nidNumber} onChange={set('nidNumber')} placeholder="1234567890123" />
            </div>
            <div className="form-group">
              <label>Address</label>
              <input className="form-control" value={form.address} onChange={set('address')} placeholder="Dhaka, Bangladesh" />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
