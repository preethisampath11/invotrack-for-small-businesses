import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { Plus, Search, FileText, Eye, Trash2, X, ChevronDown, HelpCircle, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import html2pdf from 'html2pdf.js';

const InvoicesPage = () => {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { theme } = useTheme();
  const { refreshTriggers } = useSocket();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ clientId: '', issueDate: new Date().toISOString().split('T')[0], dueDate: '', items: [{ itemId: '', description: '', quantity: 1, rate: 0, tax: 0 }], discount: 0, notes: '' });
  
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });
  const [creatingClient, setCreatingClient] = useState(false);

  const contentRef = useRef(null);

  const handleGeneratePDF = () => {
    if (!contentRef.current || !showDetail) return;
    
    // Hide buttons during PDF generation
    const printHiddenElements = contentRef.current.querySelectorAll('.print-hidden');
    printHiddenElements.forEach(el => el.style.display = 'none');

    const opt = {
      margin:       0.5,
      filename:     `Invoice_${showDetail.invoice.invoiceNumber}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(contentRef.current).save().then(() => {
      // Restore buttons
      printHiddenElements.forEach(el => el.style.display = '');
    });
  };

  const fetchAll = async () => {
    try {
      const [invRes, cliRes, itemRes, settingsRes] = await Promise.all([
        api.get('/invoices', { params: { status: statusFilter, search } }),
        api.get('/clients'),
        api.get('/items'),
        api.get('/settings')
      ]);
      setInvoices(invRes.data.invoices);
      setClients(cliRes.data.clients);
      setItems(itemRes.data.items);
      if (settingsRes.data.company?.settings?.currencySymbol) {
        setCurrencySymbol(settingsRes.data.company.settings.currencySymbol);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, [refreshTriggers.invoices, refreshTriggers.settings, statusFilter, search]);

  const addLineItem = () => setForm({ ...form, items: [...form.items, { itemId: '', description: '', quantity: 1, rate: 0, tax: 0 }] });
  const removeLineItem = (idx) => setForm({ ...form, items: form.items.filter((_, i) => i !== idx) });

  const updateLineItem = (idx, field, value) => {
    const updated = [...form.items];
    updated[idx][field] = value;
    if (field === 'itemId' && value) {
      const item = items.find(i => i._id === value);
      if (item) { updated[idx].description = item.name; updated[idx].rate = item.unitPrice; }
    }
    setForm({ ...form, items: updated });
  };

  const calcSubtotal = () => form.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
  const calcTax = () => form.items.reduce((s, i) => s + (i.quantity * i.rate * (i.tax / 100)), 0);
  const calcTotal = () => calcSubtotal() + calcTax() - (form.discount || 0);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/invoices', form);
      toast.success('Invoice created!');
      setShowModal(false);
      setForm({ clientId: '', issueDate: new Date().toISOString().split('T')[0], dueDate: '', items: [{ itemId: '', description: '', quantity: 1, rate: 0, tax: 0 }], discount: 0, notes: '' });
      setIsNewClient(false);
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleCreateInlineClient = async (e) => {
    e.preventDefault();
    setCreatingClient(true);
    try {
      const res = await api.post('/clients', newClient);
      setClients([...clients, res.data.client]);
      setForm({ ...form, clientId: res.data.client._id });
      setIsNewClient(false);
      setNewClient({ name: '', email: '', phone: '', address: '' });
      toast.success('Client created successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create client');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/invoices/${id}`, { status });
      toast.success(`Invoice marked as ${status}`);
      fetchAll();
      if (showDetail) { const res = await api.get(`/invoices/${id}`); setShowDetail(res.data); }
    } catch (err) { toast.error('Error updating status'); }
  };

  const handleLogFullPayment = async (id, total, paidAmount) => {
    try {
      await api.post('/payments', {
        invoiceId: id,
        amount: total - paidAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Other',
        referenceNumber: 'Auto-logged',
        notes: 'Full payment logged from quick action'
      });
      toast.success('Payment logged successfully');
      fetchAll();
      if (showDetail) { const res = await api.get(`/invoices/${id}`); setShowDetail(res.data); }
    } catch (err) { toast.error('Error logging payment'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    try { await api.delete(`/invoices/${id}`); toast.success('Invoice deleted'); fetchAll(); setShowDetail(null); }
    catch (err) { toast.error('Error'); }
  };

  const fmt = (v) => `${currencySymbol}${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Invoices</h1>
          <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '14px', marginTop: '4px' }}>{invoices.length} total invoices</p>
        </div>
      </div>
      {isAdmin && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <Plus size={20} /> New Invoice
          </button>
        </div>,
        document.body
      )}

      <div className="stat-card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices by ID..." className="input-field" style={{ paddingLeft: '36px' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field" style={{ width: '160px' }}>
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>Date</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>Invoice ID</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>Client</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Payment
                  <HelpCircle size={14} style={{ cursor: 'help' }} title="Tracks the money: Unpaid ($0 collected), Partial (Some money collected), or Paid (100% collected)." />
                </div>
              </th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Status
                  <HelpCircle size={14} style={{ cursor: 'help' }} title="Tracks the document: Draft (Working on it), Sent (Sent to client), Overdue (Past due date), or Cancelled." />
                </div>
              </th>
              <th style={{ textAlign: 'left', padding: '16px', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(inv => (
              <tr key={inv._id}>
                <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                <td>{inv.clientId?.name || '—'}</td>
                <td style={{ fontWeight: 600 }}>{fmt(inv.total)}</td>
                <td><span className={`badge badge-${inv.paymentStatus}`}>{inv.paymentStatus}</span></td>
                <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={async () => { const res = await api.get(`/invoices/${inv._id}`); setShowDetail(res.data); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#64748b', padding: '4px' }}><Eye size={16} /></button>
                    {isAdmin && <button onClick={() => handleDelete(inv._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444', padding: '4px' }}><Trash2 size={16} /></button>}
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', padding: '40px' }}>No invoices found</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" style={{ maxWidth: '720px', maxHeight: '85vh' }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Create Invoice</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'start' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Client</label>
                      <button type="button" onClick={() => setIsNewClient(!isNewClient)} style={{ background: 'none', border: 'none', color: theme === 'dark' ? '#4ade80' : '#16a34a', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        {isNewClient ? 'Use Existing' : '+ New Client'}
                      </button>
                    </div>
                    {isNewClient ? (
                      <div style={{ background: theme === 'dark' ? '#0f172a' : '#f8fafc', padding: '12px', borderRadius: '8px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client Name *" required className="input-field" style={{ fontSize: '13px', padding: '6px 10px' }} />
                        <input value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="Email *" type="email" required className="input-field" style={{ fontSize: '13px', padding: '6px 10px' }} />
                        <input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Phone" className="input-field" style={{ fontSize: '13px', padding: '6px 10px' }} />
                        <button type="button" onClick={handleCreateInlineClient} disabled={creatingClient || !newClient.name || !newClient.email} className="btn-primary" style={{ padding: '6px', fontSize: '12px', justifyContent: 'center' }}>
                          {creatingClient ? 'Saving...' : 'Save Client'}
                        </button>
                      </div>
                    ) : (
                      <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value })} required className="input-field">
                        <option value="">Select client</option>
                        {clients.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    )}
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Issue Date</label>
                    <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Due Date</label>
                    <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="input-field" />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '8px', display: 'block' }}>Line Items</label>
                  {form.items.map((item, idx) => (
                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 3fr 1fr 1fr 1fr auto', gap: '8px', marginBottom: '8px', alignItems: 'end' }}>
                      <select value={item.itemId} onChange={e => updateLineItem(idx, 'itemId', e.target.value)} className="input-field" style={{ fontSize: '12px' }}>
                        <option value="">Select item</option>
                        {items.map(i => <option key={i._id} value={i._id}>{i.name}</option>)}
                      </select>
                      <input value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" required className="input-field" style={{ fontSize: '12px' }} />
                      <input type="number" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))} min={1} required className="input-field" style={{ fontSize: '12px' }} placeholder="Qty" />
                      <input type="number" value={item.rate} onChange={e => updateLineItem(idx, 'rate', Number(e.target.value))} min={0} step="0.01" required className="input-field" style={{ fontSize: '12px' }} placeholder="Rate" />
                      <input type="number" value={item.tax} onChange={e => updateLineItem(idx, 'tax', Number(e.target.value))} min={0} className="input-field" style={{ fontSize: '12px' }} placeholder="Tax %" />
                      {form.items.length > 1 && <button type="button" onClick={() => removeLineItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444' }}><X size={16} /></button>}
                    </div>
                  ))}
                  <button type="button" onClick={addLineItem} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}><Plus size={14} /> Add Item</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Discount ({currencySymbol})</label>
                    <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} min={0} step="0.01" className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Notes</label>
                    <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Optional notes" />
                  </div>
                </div>

                <div style={{ background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
                  <div style={{ textAlign: 'right', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Subtotal: <strong>{fmt(calcSubtotal())}</strong></div>
                  <div style={{ textAlign: 'right', fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Tax: <strong>{fmt(calcTax())}</strong></div>
                  <div style={{ textAlign: 'right', fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Total: {fmt(calcTotal())}</div>
                </div>

                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Create Invoice</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDetail && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetail(null)}>
            <motion.div className="modal-content" style={{ maxWidth: '640px' }} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div ref={contentRef} style={{ padding: '20px', background: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{showDetail.invoice.invoiceNumber}</h2>
                  <button className="print-hidden" onClick={() => setShowDetail(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}><X size={20} /></button>
                </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                <div><span style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Client</span><p style={{ fontWeight: 600 }}>{showDetail.invoice.clientId?.name}</p></div>
                <div><span style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Status</span><p><span className={`badge badge-${showDetail.invoice.status}`}>{showDetail.invoice.status}</span></p></div>
                <div><span style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Issue Date</span><p>{new Date(showDetail.invoice.issueDate).toLocaleDateString()}</p></div>
                <div><span style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Due Date</span><p>{new Date(showDetail.invoice.dueDate).toLocaleDateString()}</p></div>
              </div>
              <div style={{ background: theme === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
                {showDetail.invoice.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: idx < showDetail.invoice.items.length - 1 ? `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` : 'none' }}>
                    <span style={{ fontSize: '14px', color: theme === 'dark' ? '#f8fafc' : '#334155' }}>{item.description} × {item.quantity}</span>
                    <span style={{ fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#334155' }}>{fmt(item.quantity * item.rate)}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '20px' }}>
                <span style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Total: <strong style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a', fontSize: '18px' }}>{fmt(showDetail.invoice.total)}</strong></span>
                <span style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Paid: <strong style={{ color: theme === 'dark' ? '#4ade80' : '#22c55e' }}>{fmt(showDetail.invoice.paidAmount)}</strong></span>
              </div>
              <div className="print-hidden" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                <button className="btn-secondary" onClick={handleGeneratePDF}><Download size={14} /> Download PDF</button>
                {isAdmin && showDetail.invoice.status === 'draft' && <button className="btn-primary" onClick={() => handleStatusChange(showDetail.invoice._id, 'sent')}>Mark as Sent</button>}
                {isAdmin && showDetail.invoice.paymentStatus !== 'paid' && <button className="btn-primary"  onClick={() => handleLogFullPayment(showDetail.invoice._id, showDetail.invoice.total, showDetail.invoice.paidAmount)}>Log Full Payment</button>}
                {isAdmin && showDetail.invoice.status !== 'overdue' && showDetail.invoice.status !== 'cancelled' && <button className="btn-danger" onClick={() => handleStatusChange(showDetail.invoice._id, 'cancelled')}>Cancel Invoice</button>}
                {isAdmin && <button className="btn-danger" onClick={() => handleDelete(showDetail.invoice._id)}><Trash2 size={14} /> Delete</button>}
                {!isAdmin && <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', padding: '8px 0' }}>View-only — contact your admin to make changes.</p>}
              </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InvoicesPage;
