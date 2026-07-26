import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Customer pages
import CustomerDashboard from './pages/customer/Dashboard';
import CustomerAccounts from './pages/customer/Accounts';
import CustomerTransactions from './pages/customer/Transactions';
import CustomerTransfer from './pages/customer/Transfer';
import CustomerLoans from './pages/customer/Loans';
import CustomerApplyLoan from './pages/customer/ApplyLoan';
import CustomerProfile from './pages/customer/Profile';

// Officer pages
import OfficerDashboard from './pages/officer/Dashboard';
import OfficerAccounts from './pages/officer/Accounts';
import OfficerTransactions from './pages/officer/Transactions';
import OfficerLoans from './pages/officer/Loans';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminBranches from './pages/admin/Branches';
import AdminAuditLogs from './pages/admin/AuditLogs';
import AdminReports from './pages/admin/Reports';
import AdminConfig from './pages/admin/Config';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const RoleRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'officer') return <Navigate to="/officer" replace />;
  return <Navigate to="/customer" replace />;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<RoleRedirect />} />

          {/* Customer */}
          <Route path="/customer" element={<ProtectedRoute roles={['customer']}><CustomerDashboard /></ProtectedRoute>} />
          <Route path="/customer/accounts" element={<ProtectedRoute roles={['customer']}><CustomerAccounts /></ProtectedRoute>} />
          <Route path="/customer/transactions/:accountId" element={<ProtectedRoute roles={['customer']}><CustomerTransactions /></ProtectedRoute>} />
          <Route path="/customer/transfer" element={<ProtectedRoute roles={['customer']}><CustomerTransfer /></ProtectedRoute>} />
          <Route path="/customer/loans" element={<ProtectedRoute roles={['customer']}><CustomerLoans /></ProtectedRoute>} />
          <Route path="/customer/loans/apply" element={<ProtectedRoute roles={['customer']}><CustomerApplyLoan /></ProtectedRoute>} />
          <Route path="/customer/profile" element={<ProtectedRoute roles={['customer']}><CustomerProfile /></ProtectedRoute>} />

          {/* Officer */}
          <Route path="/officer" element={<ProtectedRoute roles={['officer']}><OfficerDashboard /></ProtectedRoute>} />
          <Route path="/officer/accounts" element={<ProtectedRoute roles={['officer']}><OfficerAccounts /></ProtectedRoute>} />
          <Route path="/officer/transactions" element={<ProtectedRoute roles={['officer']}><OfficerTransactions /></ProtectedRoute>} />
          <Route path="/officer/loans" element={<ProtectedRoute roles={['officer']}><OfficerLoans /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/branches" element={<ProtectedRoute roles={['admin']}><AdminBranches /></ProtectedRoute>} />
          <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AdminAuditLogs /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/config" element={<ProtectedRoute roles={['admin']}><AdminConfig /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
