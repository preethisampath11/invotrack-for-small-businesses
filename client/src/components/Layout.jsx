import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Toaster } from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const { theme } = useTheme();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    <div className="app-layout">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="main-content-wrapper">
        <header className="main-container main-header">
          <h1 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a', margin: 0 }}>
            {getPageTitle()}
          </h1>
          <TopNav toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        </header>
        <main className="main-container main-content">
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
