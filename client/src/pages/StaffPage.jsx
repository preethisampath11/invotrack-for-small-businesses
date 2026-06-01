import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { UserPlus, Copy, Check, Shield, ShieldOff, Trash2, X, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const StaffPage = () => {
  const { api } = useAuth();
  const { theme } = useTheme();
  const { refreshTriggers } = useSocket();
  const [staff, setStaff] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchStaff = async () => {
    try { const res = await api.get('/staff'); setStaff(res.data.staff); setInvitations(res.data.invitations); }
    catch (err) { console.error(err); }
  };

  useEffect(() => { fetchStaff(); }, [refreshTriggers.staff]);

  const handleInvite = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/staff/invite', { email });
      setInviteLink(res.data.inviteLink);
      toast.success('Invitation created!');
      setEmail('');
      fetchStaff();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/staff/${id}/status`, { status });
      toast.success(`Staff ${status === 'active' ? 'approved' : 'status updated'}!`);
      fetchStaff();
    } catch (err) { toast.error('Error'); }
  };

  const handlePermissionToggle = async (id, canEditInventory) => {
    try {
      await api.put(`/staff/${id}/permissions`, { canEditInventory });
      toast.success(`Inventory ${canEditInventory ? 'access granted' : 'access revoked'}`);
      fetchStaff();
    } catch (err) { toast.error('Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try { await api.delete(`/staff/${id}`); toast.success('Staff removed'); fetchStaff(); }
    catch (err) { toast.error('Error'); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Staff Management</h1>
          <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '14px', marginTop: '4px' }}>{staff.length} team members</p>
        </div>
      </div>
      {createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={() => { setShowInvite(true); setInviteLink(''); }} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <UserPlus size={20} /> Invite Staff
          </button>
        </div>,
        document.body
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {staff.map((member, idx) => (
          <motion.div key={member._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="stat-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: theme === 'dark' ? '#0f172a' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#16a34a', fontSize: '16px', overflow: 'hidden' }}>
                  {member.avatar ? <img src={member.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : member.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{member.name}</h3>
                  <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>{member.email}</p>
                </div>
              </div>
              <span className={`badge badge-${member.status}`}>{member.status}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
              {member.status === 'pending' && (
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStatusUpdate(member._id, 'active')}>
                  <Shield size={14} /> Approve
                </button>
              )}
              {member.status === 'active' && (
                <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStatusUpdate(member._id, 'deactivated')}>
                  <ShieldOff size={14} /> Deactivate
                </button>
              )}
              {member.status === 'deactivated' && (
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleStatusUpdate(member._id, 'active')}>
                  <Shield size={14} /> Reactivate
                </button>
              )}
              {/* Inventory toggle — only meaningful for active staff */}
              <button
                className={member.canEditInventory ? 'btn-danger' : 'btn-secondary'}
                style={{
                  padding: '6px 12px', fontSize: '12px',
                  opacity: member.status !== 'active' ? 0.45 : 1,
                  cursor: member.status !== 'active' ? 'not-allowed' : 'pointer'
                }}
                disabled={member.status !== 'active'}
                title={member.status !== 'active' ? 'Approve the staff member first to manage permissions' : ''}
                onClick={() => handlePermissionToggle(member._id, !member.canEditInventory)}
              >
                <Package size={14} /> {member.canEditInventory ? 'Revoke Inventory' : 'Grant Inventory'}
              </button>
              <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDelete(member._id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </motion.div>
        ))}
        {staff.length === 0 && <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>No staff members yet. Invite someone!</p>}
      </div>

      {invitations.length > 0 && (
        <div className="stat-card" style={{ padding: '20px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '12px' }}>Pending Invitations</h3>
          {invitations.filter(i => i.status === 'pending').map(inv => (
            <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}` }}>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{inv.email}</span>
                <span style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', marginLeft: '8px' }}>Expires: {new Date(inv.expiresAt).toLocaleDateString()}</span>
              </div>
              <span className="badge badge-pending">Pending</span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showInvite && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowInvite(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Invite Staff Member</h2>
                <button onClick={() => setShowInvite(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleInvite} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Email Address</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-field" placeholder="staff@example.com" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Generate Invite Link</button>
              </form>
              {inviteLink && (
                <div style={{ marginTop: '20px', padding: '16px', background: theme === 'dark' ? '#064e3b' : '#f0fdf4', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#059669' : '#bbf7d0'}` }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#a7f3d0' : '#16a34a', marginBottom: '8px' }}>✅ Invite link generated! (Valid for 72 hours)</p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={inviteLink} readOnly className="input-field" style={{ fontSize: '12px', flex: 1 }} />
                    <button onClick={copyLink} className="btn-primary" style={{ padding: '8px 14px', whiteSpace: 'nowrap' }}>
                      {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StaffPage;
