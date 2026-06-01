import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import InvoicesPage from './pages/InvoicesPage';
import InventoryPage from './pages/InventoryPage';
import ClientsPage from './pages/ClientsPage';
import PaymentsPage from './pages/PaymentsPage';
import StaffPage from './pages/StaffPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '44px', height: '44px', border: '3px solid #e2e8f0', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: '#64748b' }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (user.status === 'pending') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f8faf9', padding: '20px' }}>
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', maxWidth: '440px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#fef9c3', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '16px' }}>⏳</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px', color: '#0f172a' }}>Account Pending Approval</h2>
          <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>Your account is waiting for admin approval. You will be able to access the system once approved.</p>
        </div>
      </div>
    );
  }

  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
};

const AppRoutes = () => {
  return (
    <SocketProvider>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="invoices" element={<InvoicesPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="clients" element={<ClientsPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="staff" element={<ProtectedRoute adminOnly><StaffPage /></ProtectedRoute>} />
          <Route path="settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SocketProvider>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
