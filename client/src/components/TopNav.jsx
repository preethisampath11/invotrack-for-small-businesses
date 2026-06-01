import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TopNav = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{
      background: theme === 'dark' ? '#1e293b' : '#f8fafc',
      borderRadius: '24px',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '12px',
      padding: '8px 16px 8px 12px',
      boxShadow: theme === 'dark' ? '0 4px 12px rgba(0,0,0,0.2)' : '0 4px 12px rgba(99,102,241,0.08)',
      border: `1px solid ${theme === 'dark' ? '#334155' : 'transparent'}`,
      zIndex: 30
    }}>
      <button 
        onClick={toggleTheme} 
        style={{ 
          background: 'none', 
          border: 'none', 
          color: theme === 'dark' ? '#cbd5e1' : '#64748b', 
          cursor: 'pointer', 
          display: 'flex', 
          alignItems: 'center',
          padding: '4px',
          borderRadius: '50%',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = theme === 'dark' ? '#334155' : '#e2e8f0'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div 
        onClick={() => navigate('/profile')}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          cursor: 'pointer',
          padding: '4px 8px',
          borderRadius: '16px',
          transition: 'background 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.background = theme === 'dark' ? '#334155' : '#e2e8f0'}
        onMouseOut={e => e.currentTarget.style.background = 'none'}
      >
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: theme === 'dark' ? '#334155' : '#e2e8f0', 
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '14px', fontWeight: 600,
          color: theme === 'dark' ? '#cbd5e1' : '#64748b', overflow: 'hidden'
        }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            user?.name?.charAt(0)?.toUpperCase()
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#1e293b', lineHeight: '1.2' }}>
            {user?.name}
          </span>
          <span style={{ fontSize: '12px', color: theme === 'dark' ? '#94a3b8' : '#64748b', textTransform: 'capitalize', lineHeight: '1.2' }}>
            {user?.role}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TopNav;
