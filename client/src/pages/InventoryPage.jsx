import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, Package, Edit, Trash2, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const InventoryPage = () => {
  const { api, user } = useAuth();
  const { theme } = useTheme();
  const { refreshTriggers } = useSocket();
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', description: '', unitPrice: '', stock: '', isService: false });
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  const canEdit = user?.role === 'admin' || user?.canEditInventory;

  const fetchItems = async () => {
    try {
      const [itemsRes, settingsRes] = await Promise.all([
        api.get('/items'),
        api.get('/settings')
      ]);
      setItems(itemsRes.data.items);
      if (settingsRes.data.company?.settings?.lowStockThreshold !== undefined) {
        setLowStockThreshold(settingsRes.data.company.settings.lowStockThreshold);
      }
      if (settingsRes.data.company?.settings?.currencySymbol) {
        setCurrencySymbol(settingsRes.data.company.settings.currencySymbol);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchItems(); }, [refreshTriggers.inventory, refreshTriggers.settings]);

  const filtered = items.filter(i => i.name.toLowerCase().includes(search.toLowerCase()) || i.sku?.toLowerCase().includes(search.toLowerCase()));

  const openCreate = () => { setEditItem(null); setForm({ name: '', sku: '', description: '', unitPrice: '', stock: '', isService: false }); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ name: item.name, sku: item.sku || '', description: item.description || '', unitPrice: item.unitPrice, stock: item.stock ?? '', isService: item.isService }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editItem) {
        await api.put(`/items/${editItem._id}`, { ...form, unitPrice: Number(form.unitPrice), stock: form.isService ? null : Number(form.stock) });
        toast.success('Item updated!');
      } else {
        await api.post('/items', { ...form, unitPrice: Number(form.unitPrice), stock: form.isService ? null : Number(form.stock) });
        toast.success('Item created!');
      }
      setShowModal(false);
      fetchItems();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/items/${id}`); toast.success('Item deleted'); fetchItems(); }
    catch (err) { toast.error('Error'); }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Inventory</h1>
          <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '14px', marginTop: '4px' }}>{items.length} items & services</p>
        </div>
      </div>
      {canEdit && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={openCreate} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <Plus size={20} /> Add Item
          </button>
        </div>,
        document.body
      )}

      {/* View-only notice for restricted staff */}
      {!canEdit && user?.role === 'staff' && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 16px', marginBottom: '16px',
          background: theme === 'dark' ? 'rgba(253,224,71,0.1)' : '#fffbeb', border: `1px solid ${theme === 'dark' ? 'rgba(253,224,71,0.2)' : '#fde68a'}`,
          borderRadius: '12px', fontSize: '13px', color: theme === 'dark' ? '#fde047' : '#92400e'
        }}>
          <span style={{ fontSize: '16px' }}>🔒</span>
          <span><strong>View-only access.</strong> You can browse inventory items but cannot add, edit, or delete them. Ask your admin to grant inventory edit permissions.</span>
        </div>
      )}

      <div className="stat-card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..." className="input-field" style={{ paddingLeft: '36px' }} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtered.map((item, idx) => (
          <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="stat-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: item.isService ? (theme === 'dark' ? 'rgba(59,130,246,0.1)' : '#eff6ff') : (theme === 'dark' ? 'rgba(34,197,94,0.1)' : '#f0fdf4'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={20} color={item.isService ? '#3b82f6' : '#22c55e'} />
              </div>
              {canEdit && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button onClick={() => openEdit(item)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#64748b', padding: '4px' }}><Edit size={14} /></button>
                  <button onClick={() => handleDelete(item._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
                </div>
              )}
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '4px' }}>{item.name}</h3>
            {item.sku && <p style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', marginBottom: '8px' }}>SKU: {item.sku}</p>}
            {item.description && <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginBottom: '12px' }}>{item.description}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{currencySymbol}{item.unitPrice.toFixed(2)}</span>
              {item.isService ? (
                <span className="badge badge-sent">Service</span>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: item.stock <= lowStockThreshold ? theme === 'dark' ? '#f87171' : '#ef4444' : item.stock <= lowStockThreshold + 10 ? '#f59e0b' : '#22c55e' }}>
                  {item.stock <= lowStockThreshold && <AlertTriangle size={14} />}
                  Stock: {item.stock}
                </span>
              )}
            </div>
          </motion.div>
        ))}
        {filtered.length === 0 && <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>No items found</p>}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{editItem ? 'Edit Item' : 'Add Item'}</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Name</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" placeholder="Widget A" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>SKU</label>
                    <input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} className="input-field" placeholder="WDG-001" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Unit Price</label>
                    <input type="number" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} required min={0} step="0.01" className="input-field" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Description</label>
                  <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-field" rows={2} placeholder="Optional description" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" id="isService" checked={form.isService} onChange={e => setForm({ ...form, isService: e.target.checked })} />
                  <label htmlFor="isService" style={{ fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>This is a service (no stock tracking)</label>
                </div>
                {!form.isService && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Stock Count</label>
                    <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} min={0} className="input-field" />
                  </div>
                )}
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>{editItem ? 'Update Item' : 'Add Item'}</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;
