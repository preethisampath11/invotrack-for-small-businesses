import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import { Toaster } from 'react-hot-toast';

const Layout = () => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      <Sidebar />
      <main style={{ flex: 1, marginLeft: '264px', padding: '24px 32px', minHeight: '100vh', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '24px', right: '32px', zIndex: 30 }}>
          <TopNav />
        </div>
        <Outlet />
      </main>
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
