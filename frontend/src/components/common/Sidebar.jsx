import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const customerLinks = [
  { to: '/customer', label: 'Dashboard', icon: '🏠' },
  { to: '/customer/accounts', label: 'My Accounts', icon: '🏦' },
  { to: '/customer/transfer', label: 'Transfer Funds', icon: '💸' },
  { to: '/customer/loans', label: 'Loans', icon: '📋' },
  { to: '/customer/profile', label: 'Profile', icon: '👤' },
];

const officerLinks = [
  { to: '/officer', label: 'Dashboard', icon: '🏠' },
  { to: '/officer/accounts', label: 'Account Requests', icon: '🏦' },
  { to: '/officer/transactions', label: 'Transactions', icon: '💳' },
  { to: '/officer/loans', label: 'Loan Applications', icon: '📋' },
];

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '🏠' },
  { to: '/admin/users', label: 'Users & Officers', icon: '👥' },
  { to: '/admin/branches', label: 'Branches', icon: '🏢' },
  { to: '/admin/reports', label: 'Reports', icon: '📊' },
  { to: '/admin/config', label: 'System Config', icon: '⚙️' },
  { to: '/admin/audit-logs', label: 'Audit Logs', icon: '🔍' },
];

const roleLinks = { customer: customerLinks, officer: officerLinks, admin: adminLinks };
const roleTitles = { customer: 'Customer Portal', officer: 'Officer Portal', admin: 'Admin Portal' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = roleLinks[user?.role] || [];

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h2>🏦 MiniBank</h2>
        <span>{roleTitles[user?.role]}</span>
      </div>

      <nav>
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.name}</strong>
          <br />{user?.email}
        </div>
        <button className="btn-logout" onClick={handleLogout}>🚪 Logout</button>
      </div>
    </aside>
  );
}
