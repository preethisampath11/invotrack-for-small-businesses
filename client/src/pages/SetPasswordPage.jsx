import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const SetPasswordPage = () => {
  const { user, api, updateUser } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  // If user already has a password, send them to dashboard
  useEffect(() => {
    if (user && user.hasPassword) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (form.newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/profile', { newPassword: form.newPassword });
      updateUser(res.data.user);
      toast.success('Password set successfully!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error setting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: theme === 'dark' ? '#0f172a' : '#f8faf9', padding: '20px' }}>
      <div className="stat-card animate-fade-in" style={{ padding: '40px', maxWidth: '440px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: theme === 'dark' ? '#334155' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={32} color={theme === 'dark' ? '#f59e0b' : '#f59e0b'} />
          </div>
        </div>
        
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: 800, color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '8px' }}>Action Required</h2>
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '15px' }}>
            For safety purposes, you must set a password for your account before accessing the dashboard.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>New Password</label>
            <input 
              type="password" 
              value={form.newPassword} 
              onChange={e => setForm({ ...form, newPassword: e.target.value })} 
              required 
              minLength={6}
              className="input-field" 
              placeholder="Enter a strong password" 
            />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Confirm Password</label>
            <input 
              type="password" 
              value={form.confirmPassword} 
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })} 
              required 
              className="input-field" 
              placeholder="Confirm your password" 
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '16px', marginTop: '8px' }}>
            {loading ? 'Setting Password...' : 'Set Password'} <Save size={18} style={{ marginLeft: '8px' }} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetPasswordPage;
