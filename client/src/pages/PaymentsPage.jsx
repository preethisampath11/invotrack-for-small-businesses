import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Plus, CreditCard, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const PaymentsPage = () => {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { theme } = useTheme();
  const { refreshTriggers } = useSocket();
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [form, setForm] = useState({ invoiceId: '', amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '', notes: '' });

  const fetchAll = async () => {
    try {
      const [payRes, invRes, settingsRes] = await Promise.all([api.get('/payments'), api.get('/invoices'), api.get('/settings')]);
      setPayments(payRes.data.payments);
      setInvoices(invRes.data.invoices.filter(i => i.paymentStatus !== 'paid'));
      if (settingsRes.data.company?.settings?.currencySymbol) {
        setCurrencySymbol(settingsRes.data.company.settings.currencySymbol);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchAll(); }, [refreshTriggers.payments, refreshTriggers.invoices, refreshTriggers.settings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payments', { ...form, amount: Number(form.amount) });
      toast.success('Payment recorded!');
      setShowModal(false);
      setForm({ invoiceId: '', amount: '', paymentMethod: 'Cash', paymentDate: new Date().toISOString().split('T')[0], referenceNumber: '', notes: '' });
      fetchAll();
    } catch (err) { toast.error(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment?')) return;
    try { await api.delete(`/payments/${id}`); toast.success('Payment deleted'); fetchAll(); }
    catch (err) { toast.error('Error'); }
  };

  const fmt = (v) => `${currencySymbol}${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Payments</h1>
          <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '14px', marginTop: '4px' }}>{payments.length} payments recorded</p>
        </div>
      </div>
      {isAdmin && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(99,102,241,0.4)' }}>
            <Plus size={20} /> Record Payment
          </button>
        </div>,
        document.body
      )}

      <div className="table-container">
        <table>
          <thead><tr><th>Date</th><th>Invoice</th><th>Amount</th><th>Method</th><th>Reference</th><th>Recorded By</th><th></th></tr></thead>
          <tbody>
            {payments.map(p => (
              <tr key={p._id}>
                <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                <td style={{ fontWeight: 600 }}>{p.invoiceId?.invoiceNumber || '—'}</td>
                <td style={{ fontWeight: 700, color: theme === 'dark' ? '#4ade80' : '#22c55e' }}>{fmt(p.amount)}</td>
                <td><span className="badge badge-active">{p.paymentMethod}</span></td>
                <td style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>{p.referenceNumber || '—'}</td>
                <td>{p.recordedBy?.name || '—'}</td>
                <td>
                  {isAdmin && <button onClick={() => handleDelete(p._id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444', padding: '4px' }}><Trash2 size={16} /></button>}
                </td>
              </tr>
            ))}
            {payments.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', padding: '40px' }}>No payments recorded yet</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowModal(false)}>
            <motion.div className="modal-content" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Record Payment</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Invoice</label>
                  <select 
                    value={form.invoiceId} 
                    onChange={e => {
                      const selectedId = e.target.value;
                      if (!selectedId) {
                        setForm({ ...form, invoiceId: '', amount: '' });
                        return;
                      }
                      const selectedInvoice = invoices.find(i => i._id === selectedId);
                      const remaining = selectedInvoice ? (selectedInvoice.total - selectedInvoice.paidAmount) : '';
                      setForm({ ...form, invoiceId: selectedId, amount: remaining });
                    }} 
                    required 
                    className="input-field"
                  >
                    <option value="">Select invoice</option>
                    {invoices.map(i => <option key={i._id} value={i._id}>{i.invoiceNumber} — {fmt(i.total - i.paidAmount)} remaining</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Amount</label>
                    <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} required min={0.01} step="0.01" className="input-field" />
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Payment Date</label>
                    <input type="date" value={form.paymentDate} onChange={e => setForm({ ...form, paymentDate: e.target.value })} required className="input-field" />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Method</label>
                    <select value={form.paymentMethod} onChange={e => setForm({ ...form, paymentMethod: e.target.value })} className="input-field">
                      <option>Cash</option><option>Bank Transfer</option><option>Stripe</option><option>PayPal</option><option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Reference #</label>
                    <input value={form.referenceNumber} onChange={e => setForm({ ...form, referenceNumber: e.target.value })} className="input-field" placeholder="Optional" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#475569', marginBottom: '6px', display: 'block' }}>Notes</label>
                  <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" rows={2} placeholder="Optional" />
                </div>
                <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Record Payment</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PaymentsPage;
