import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, Edit, Trash2, X, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const ClientsPage = () => {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { theme } = useTheme();
  const { refreshTriggers } = useSocket();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', address: { street: '', city: '', state: '', zip: '', country: '' } });
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const fetchClients = async () => {
    try {
      const [clientsRes, settingsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/settings')
      ]);
      setClients(clientsRes.data.clients);
      if (settingsRes.data.company?.settings?.currencySymbol) {
        setCurrencySymbol(settingsRes.data.company.settings.currencySymbol);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchClients(); }, [refreshTriggers.clients, refreshTriggers.settings]);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditClient(null); setForm({ name: '', email: '', phone: '', address: { street: '', city: '', state: '', zip: '', country: '' } }); setShowModal(true); };
  const openEdit = (c) => { setEditClient(c); setForm({ name: c.name, email: c.email, phone: c.phone || '', address: c.address || {} }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editClient) { await api.put(`/clients/${editClient._id}`, form); toast.success('Client updated!'); }
      else { await api.post('/clients', form); toast.success('Client added!'); }
      setShowModal(false); fetchClients();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this client?')) return;
    try { await api.delete(`/clients/${id}`); toast.success('Client deleted'); fetchClients(); }
    catch (err) { toast.error('Error'); }
  };

  const fmt = (v) => `${currencySymbol}${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Clients</h1>
          <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '14px', marginTop: '4px' }}>{clients.length} active clients</p>
        </div>
      </div>
      {isAdmin && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={openCreate} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <Plus size={20} /> Add Client
          </button>
        </div>,
        document.body
      )}

      <div className="stat-card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients..." className="input-field" style={{ paddingLeft: '36px' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
        {filtered.map((client, idx) => (
          <motion.div key={client._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="stat-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: theme === 'dark' ? 'rgba(34,197,94,0.1)' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#16a34a', fontSize: '16px' }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{client.name}</h3>
                  <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>{client.email}</p>
                </div>
              </div>
              {isAdmin && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(client)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#64748b', padding: '4px' }}><Edit size={14} /></button>
                  <button onClick={() => handleDelete(client._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            {client.phone && <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginBottom: '12px' }}>📞 {client.phone}</p>}
            <div style={{ display: 'flex', gap: '16px', paddingTop: '12px', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}` }}>
              <div><span style={{ fontSize: '11px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Invoices</span><p style={{ fontWeight: 700, fontSize: '15px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{client.invoiceCount || 0}</p></div>
              <div><span style={{ fontSize: '11px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Billed</span><p style={{ fontWeight: 700, fontSize: '15px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{fmt(client.totalBilled)}</p></div>
              <div><span style={{ fontSize: '11px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Outstanding</span><p style={{ fontWeight: 700, fontSize: '15px', color: client.outstanding > 0 ? theme === 'dark' ? '#f87171' : '#ef4444' : theme === 'dark' ? '#4ade80' : '#22c55e' }}>{fmt(client.outstanding)}</p></div>
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>No clients found</p>}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{editClient ? 'Edit Client' : 'Add Client'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Phone</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Street</label>
                  <input value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className="input-field" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <input value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="input-field" placeholder="City" />
                  <input value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="input-field" placeholder="State" />
                  <input value={form.address.zip} onChange={e => setForm({ ...form, address: { ...form.address, zip: e.target.value } })} className="input-field" placeholder="ZIP" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{editClient ? 'Update Client' : 'Add Client'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientsPage;
