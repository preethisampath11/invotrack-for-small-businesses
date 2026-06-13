import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { theme } = useTheme();
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/' || path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/invoices')) return 'Invoices';
    if (path.startsWith('/inventory')) return 'Inventory';
    if (path.startsWith('/clients')) return 'Clients';
    if (path.startsWith('/payments')) return 'Payments';
    if (path.startsWith('/staff')) return 'Staff';
    if (path.startsWith('/settings')) return 'Settings';
    if (path.startsWith('/profile')) return 'My Profile';
    return '';
  };
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: theme === 'dark' ? '#0f172a' : '#f8fafc' }}>
      <Sidebar />
      <div style={{ flex: 1, marginLeft: '264px', padding: '24px 24px 24px 0', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header className="main-container" style={{ 
          height: '72px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          padding: '0 24px',
          flexShrink: 0
        }}>
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a', margin: 0 }}>
            {getPageTitle()}
          </h1>
          <TopNav />
        </header>
        <main className="main-container" style={{ flex: 1, padding: '32px', position: 'relative', overflowX: 'hidden' }}>
          <Outlet />
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { background: '#1e293b', color: '#f8fafc', borderRadius: '12px', padding: '12px 16px', fontSize: '14px' }
        }}
      />
    </div>
  );
};

export default Layout;
