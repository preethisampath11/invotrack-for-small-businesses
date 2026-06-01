import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Package, Users, UserCheck,
  Settings, LogOut, User, CreditCard, Moon, Sun
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const mainLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/invoices', label: 'Invoices', icon: FileText },
    { to: '/inventory', label: 'Inventory', icon: Package },
    { to: '/clients', label: 'Clients', icon: Users },
    { to: '/payments', label: 'Payments', icon: CreditCard },
  ];

  const adminLinks = [
    { to: '/staff', label: 'Staff', icon: UserCheck },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside style={{
      width: '240px',
      height: 'calc(100vh - 24px)',
      background: theme === 'dark' ? '#1e293b' : 'var(--bg-color, #ffffff)',
      borderRadius: '20px',
      boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(99,102,241,0.15)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      position: 'fixed',
      left: '12px',
      top: '12px',
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #818cf8, #4f46e5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '16px',
          boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
        }}>
          I
        </div>
        <span style={{ fontSize: '18px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>InvoTrack</span>
      </div>

      <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '12px', marginBottom: '8px' }}>
        Main Menu
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {mainLinks.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '12px',
              textDecoration: 'none', fontSize: '14px', fontWeight: 500,
              color: isActive ? (theme === 'dark' ? '#818cf8' : '#4338ca') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
              background: isActive ? (theme === 'dark' ? 'rgba(99,102,241,0.15)' : '#eef2ff') : 'transparent',
              transition: 'all 0.15s ease'
            })}
          >
            <link.icon size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {user?.role === 'admin' && (
        <>
          <div style={{ fontSize: '11px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: '12px', marginTop: '24px', marginBottom: '8px' }}>
            Management
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {adminLinks.map(link => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '12px',
                  textDecoration: 'none', fontSize: '14px', fontWeight: 500,
                  color: isActive ? (theme === 'dark' ? '#818cf8' : '#4338ca') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                  background: isActive ? (theme === 'dark' ? 'rgba(99,102,241,0.15)' : '#eef2ff') : 'transparent',
                  transition: 'all 0.15s ease'
                })}
              >
                <link.icon size={18} />
                {link.label}
              </NavLink>
            ))}
          </nav>
        </>
      )}

      <div style={{ marginTop: 'auto', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}`, paddingTop: '16px' }}>
        <NavLink
          to="/profile"
          style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '12px',
            textDecoration: 'none', fontSize: '14px', fontWeight: 500,
            color: isActive ? (theme === 'dark' ? '#818cf8' : '#4338ca') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
            background: isActive ? (theme === 'dark' ? 'rgba(99,102,241,0.15)' : '#eef2ff') : 'transparent',
            marginBottom: '4px'
          })}
        >
          <User size={18} />
          Profile
        </NavLink>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '10px 12px', borderRadius: '10px',
            border: 'none', background: 'transparent',
            fontSize: '14px', fontWeight: 500, color: '#ef4444',
            cursor: 'pointer', width: '100%', textAlign: 'left'
          }}
        >
          <LogOut size={18} />
          Logout
        </button>

      </div>
    </aside>
  );
};

export default Sidebar;
