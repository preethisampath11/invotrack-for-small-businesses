import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Package, Users, UserCheck,
  Settings, LogOut, User, CreditCard, Moon, Sun, X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
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
    <>
    {/* Backdrop for mobile */}
    {isOpen && (
      <div 
        onClick={() => setIsOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.5)' }} 
      />
    )}
    <aside className={`sidebar-wrapper ${isOpen ? 'open' : ''}`} style={{
      background: theme === 'dark' ? '#1e293b' : 'var(--bg-color, #ffffff)',
      borderRadius: '20px',
      boxShadow: theme === 'dark' ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(58,74,83,0.15)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <button 
        className="mobile-menu-btn" 
        onClick={() => setIsOpen(false)}
        style={{ position: 'absolute', top: '16px', right: '16px' }}
      >
        <X size={20} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '12px',
          background: 'linear-gradient(135deg, #948f80, #2c3940)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: 800, fontSize: '16px',
          boxShadow: '0 4px 12px rgba(58,74,83,0.3)'
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
              color: isActive ? (theme === 'dark' ? '#948f80' : '#2c3940') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
              background: isActive ? (theme === 'dark' ? 'rgba(58,74,83,0.15)' : '#fbf9f6') : 'transparent',
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
                  color: isActive ? (theme === 'dark' ? '#948f80' : '#2c3940') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
                  background: isActive ? (theme === 'dark' ? 'rgba(58,74,83,0.15)' : '#fbf9f6') : 'transparent',
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
            color: isActive ? (theme === 'dark' ? '#948f80' : '#2c3940') : (theme === 'dark' ? '#94a3b8' : '#64748b'),
            background: isActive ? (theme === 'dark' ? 'rgba(58,74,83,0.15)' : '#fbf9f6') : 'transparent',
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
    </>
  );
};

export default Sidebar;
