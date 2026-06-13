import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Plus, Search, Package, Edit, Trash2, X, AlertTriangle, TrendingUp, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const productItems = items.filter(i => !i.isService);
  const activeItems = productItems.length;
  const outOfStock = productItems.filter(i => i.stock === 0).length;
  const lowStockCount = productItems.filter(i => i.stock > 0 && i.stock <= lowStockThreshold).length;
  const inventoryValue = productItems.reduce((acc, i) => acc + (i.unitPrice * Math.max(0, i.stock || 0)), 0);
  const avgPrice = activeItems > 0 ? productItems.reduce((acc, i) => acc + i.unitPrice, 0) / activeItems : 0;
  const totalUnits = productItems.reduce((acc, i) => acc + Math.max(0, i.stock || 0), 0);
  const stockHealth = activeItems > 0 ? Math.round(((activeItems - outOfStock - lowStockCount) / activeItems) * 100) : 0;

  const formatShort = (val) => {
    if (val >= 100000) return `${currencySymbol}${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(1)}K`;
    return `${currencySymbol}${val.toFixed(2)}`;
  };

  return (
    <div className="animate-fade-in">

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

      {canEdit && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={openCreate} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(58,74,83,0.4)' }}>
            <Plus size={20} /> Add Item
          </button>
        </div>,
        document.body
      )}

      {/* Top Stat Cards matching theme */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #3a4a53, #1e293b)', color: '#fbf9f6', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Items</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', margin: '4px 0' }}>{activeItems}</div>
              <div style={{ fontSize: '13px', color: '#cbd5e1' }}>Active stock items</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px' }}><Package size={20} color="#ffffff" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
            <span style={{ color: '#cbd5e1' }}>Stock Health</span>
            <span style={{ fontWeight: 700, color: stockHealth > 80 ? '#4ade80' : stockHealth > 50 ? '#fde047' : '#f87171' }}>{stockHealth}%</span>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #c4b093, #ac9e89)', color: '#0f172a', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#3a4a53', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Low Stock</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{lowStockCount + outOfStock}</div>
              <div style={{ fontSize: '13px', color: '#515b5e' }}>Below {lowStockThreshold} units threshold</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.06)', padding: '10px', borderRadius: '12px' }}><AlertCircle size={20} color="#0f172a" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.06)', fontSize: '12px' }}>
            <span style={{ color: '#3a4a53' }}>Alert Level</span>
            <span style={{ fontWeight: 800, color: outOfStock > 0 ? '#b91c1c' : lowStockCount > 0 ? '#b45309' : '#15803d' }}>{outOfStock > 0 ? 'Critical' : lowStockCount > 0 ? 'Low' : 'Normal'}</span>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f6d1a1, #e4c5a0)', color: '#0f172a', border: 'none' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#515b5e', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Stock Value</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '4px 0' }}>{formatShort(inventoryValue)}</div>
              <div style={{ fontSize: '13px', color: '#686d69' }}>Total inventory value</div>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '12px' }}><TrendingUp size={20} color="#0f172a" /></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(0,0,0,0.05)', fontSize: '12px' }}>
            <span style={{ color: '#515b5e' }}>Performance</span>
            <span style={{ fontWeight: 800, color: '#15803d' }}>Good</span>
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', alignItems: 'flex-start' }}>
        
        {/* Left Column: Item List */}
        <div style={{ flex: '1 1 500px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Item List</h2>
            <div style={{ position: 'relative', width: '250px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or sku..." className="input-field" style={{ paddingLeft: '36px' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map((item, idx) => {
              const statusColor = item.isService ? '#3b82f6' : (item.stock === 0 ? '#ef4444' : item.stock <= lowStockThreshold ? '#f59e0b' : '#22c55e');
              return (
              <motion.div key={item._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="stat-card" style={{ padding: '20px', borderLeft: `6px solid ${statusColor}`, cursor: canEdit ? 'pointer' : 'default' }} onClick={() => canEdit && openEdit(item)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: `${statusColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Package size={20} color={statusColor} />
                  </div>
                  {canEdit && (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#64748b', padding: '4px' }}><Edit size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(item._id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444', padding: '4px' }}><Trash2 size={14} /></button>
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
            )})}
            {filtered.length === 0 && <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', textAlign: 'center', gridColumn: '1 / -1', padding: '40px' }}>No items found</p>}
          </div>
        </div>

        {/* Right Column: Quick Stats */}
        <div className="stat-card" style={{ flex: '1 1 300px', maxWidth: '400px', padding: '24px', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '20px' }}>Quick Stats</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#22c55e20', padding: '6px', borderRadius: '8px' }}><Package size={16} color="#22c55e" /></div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Active Items</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{activeItems}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#ef444420', padding: '6px', borderRadius: '8px' }}><AlertCircle size={16} color="#ef4444" /></div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Out of Stock</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: outOfStock > 0 ? '#ef4444' : (theme === 'dark' ? '#f8fafc' : '#0f172a') }}>{outOfStock}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#f59e0b20', padding: '6px', borderRadius: '8px' }}><AlertTriangle size={16} color="#f59e0b" /></div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Low Stock</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: lowStockCount > 0 ? '#f59e0b' : (theme === 'dark' ? '#f8fafc' : '#0f172a') }}>{lowStockCount}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#3a4a5320', padding: '6px', borderRadius: '8px' }}><TrendingUp size={16} color={theme === 'dark' ? '#94a3b8' : '#3a4a53'} /></div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Inventory Value</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{formatShort(inventoryValue)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#64748b20', padding: '6px', borderRadius: '8px' }}><span style={{ fontSize: '16px', fontWeight: 800, color: '#64748b' }}>%</span></div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Avg Price</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{currencySymbol}{avgPrice.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: '#64748b20', padding: '6px', borderRadius: '8px' }}><Package size={16} color="#64748b" /></div>
                <span style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Total Units</span>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{totalUnits}</span>
            </div>
          </div>
        </div>
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
