import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const ProfilePage = () => {
  const { user, api, updateUser } = useAuth();
  const { theme } = useTheme();
  const [form, setForm] = useState({ name: user?.name || '', currentPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = { name: form.name };
      if (form.newPassword) {
        data.currentPassword = form.currentPassword;
        data.newPassword = form.newPassword;
      }
      const res = await api.put('/auth/profile', data);
      updateUser(res.data.user);
      setForm({ ...form, currentPassword: '', newPassword: '' });
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
    finally { setLoading(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('avatar', file);
    formData.append('name', form.name);
    try {
      const res = await api.put('/auth/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data.user);
      toast.success('Avatar updated!');
    } catch (err) { toast.error('Error uploading avatar'); }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>My Profile</h1>
        <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '14px', marginTop: '4px' }}>Manage your personal details</p>
      </div>

      <div className="stat-card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '16px', background: theme === 'dark' ? '#0f172a' : '#f0fdf4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 800, color: theme === 'dark' ? '#4ade80' : '#16a34a', fontSize: '28px', overflow: 'hidden',
            border: `3px solid ${theme === 'dark' ? '#334155' : '#dcfce7'}`
          }}>
            {user?.avatar ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{user?.name}</h2>
            <p style={{ fontSize: '14px', color: theme === 'dark' ? '#94a3b8' : '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {user?.email}</p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              <span className={`badge badge-${user?.role === 'admin' ? 'active' : 'sent'}`}>
                <Shield size={12} style={{ marginRight: '4px' }} /> {user?.role}
              </span>
              <span className={`badge badge-${user?.status}`}>{user?.status}</span>
            </div>
          </div>
        </div>

        <label className="btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
          Change Avatar
          <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
        </label>
      </div>

      <form onSubmit={handleSubmit} className="stat-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Edit Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Full Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" />
          </div>

          {user?.passwordHash !== null && !user?.googleId && (
            <>
              <div style={{ borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}`, paddingTop: '16px', marginTop: '4px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '12px' }}>Change Password</h4>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Current Password</label>
                <input type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} className="input-field" placeholder="Enter current password" />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>New Password</label>
                <input type="password" value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} className="input-field" placeholder="Enter new password" minLength={6} />
              </div>
            </>
          )}

          <button type="submit" className="btn-primary" disabled={loading} style={{ alignSelf: 'flex-end' }}>
            <Save size={16} /> {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfilePage;
