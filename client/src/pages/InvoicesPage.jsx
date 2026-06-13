                                                                                                                                                                                                                                                                                                                                                                                                          import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { Plus, Search, FileText, Eye, Trash2, X, ChevronDown, HelpCircle, Download, MoreHorizontal, Send, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

const InvoicesPage = () => {
  const { api, user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { theme } = useTheme();
  const navigate = useNavigate();

  // ── UI state (not data) ────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [page, setPage] = useState(1);

  const contentRef = useRef(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const invoiceParams = { status: statusFilter, search, page, limit: 10 };

  /**
   * Main invoice list. `keepPreviousData` keeps the old page visible
   * while the next page loads, preventing layout flicker during pagination.
   */
  const {
    data: invoiceData,
    isLoading: invoicesLoading,
    isError: invoicesError,
  } = useQuery({
    queryKey: queryKeys.invoices(invoiceParams),
    queryFn: () => api.get('/invoices', { params: invoiceParams }).then(r => r.data),
    placeholderData: keepPreviousData,
  });

  // Settings — for currency symbol
  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.get('/settings').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const invoices = invoiceData?.invoices ?? [];
  const totalPages = invoiceData?.totalPages ?? 1;
  const currencySymbol = settingsData?.company?.settings?.currencySymbol ?? '$';

  // ── Mutations ──────────────────────────────────────────────────────────────

  const invalidateInvoices = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/invoices/${id}`),
    onSuccess: () => {
      invalidateInvoices();
      toast.success('Invoice deleted');
      setShowDetail(null);
    },
    onError: () => toast.error('Error deleting invoice'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => api.put(`/invoices/${id}`, { status }),
    onSuccess: async (_, { id }) => {
      invalidateInvoices();
      toast.success('Invoice status updated');
      // Refresh the open detail modal if it belongs to the same invoice
      if (showDetail?.invoice?._id === id) {
        const res = await api.get(`/invoices/${id}`);
        setShowDetail(res.data);
      }
    },
    onError: () => toast.error('Error updating status'),
  });

  const sendEmailMutation = useMutation({
    mutationFn: (id) => api.post(`/invoices/${id}/send`),
    onMutate: () => toast.loading('Generating & Sending Email...', { id: 'email-gen' }),
    onSuccess: (_, id) => {
      toast.success('Invoice emailed successfully!', { id: 'email-gen' });
      invalidateInvoices();
      if (showDetail?.invoice?._id === id) {
        api.get(`/invoices/${id}`).then(res => setShowDetail(res.data));
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to send email', { id: 'email-gen' }),
  });

  const logPaymentMutation = useMutation({
    mutationFn: ({ id, total, paidAmount }) =>
      api.post('/payments', {
        invoiceId: id,
        amount: total - paidAmount,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Other',
        referenceNumber: 'Auto-logged',
        notes: 'Full payment logged from quick action',
      }),
    onSuccess: async (_, { id }) => {
      invalidateInvoices();
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('Payment logged successfully');
      if (showDetail?.invoice?._id === id) {
        const res = await api.get(`/invoices/${id}`);
        setShowDetail(res.data);
      }
    },
    onError: () => toast.error('Error logging payment'),
  });

  // ── PDF generation (backend API) ──────────────

  const handleDownloadDirectly = async (id, invoiceNumber) => {
    try {
      toast.loading('Generating PDF...', { id: 'pdf-gen' });
      const response = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice_${invoiceNumber || id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF Downloaded!', { id: 'pdf-gen' });
    } catch (err) {
      console.error(err);
      toast.error('Failed to download PDF', { id: 'pdf-gen' });
    }
  };

  // ── Form helpers ───────────────────────────────────────────────────────────

  const fmt = (v) => `${currencySymbol}${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      {isAdmin && createPortal(
        <div className="animate-fade-in" style={{ position: 'fixed', bottom: '32px', right: '32px', zIndex: 40, animationDelay: '0.1s' }}>
          <button className="btn-primary" onClick={() => navigate('/invoices/new')} style={{ padding: '14px 24px', fontSize: '15px', borderRadius: '100px', boxShadow: '0 8px 32px rgba(58,74,83,0.4)' }}>
            <Plus size={20} /> New Invoice
          </button>
        </div>,
        document.body
      )}

      {/* Search + filter bar */}
      <div className="stat-card" style={{ padding: '16px 20px', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }} />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search invoices by ID..."
            className="input-field"
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-field"
          style={{ width: '160px' }}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Invoices table */}
      <div className="table-container">
        {invoicesLoading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
            Loading invoices...
          </div>
        ) : invoicesError ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#ef4444' }}>
            Failed to load invoices. Please refresh.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
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
                <tr
                  key={inv._id}
                  onClick={async () => { const res = await api.get(`/invoices/${inv._id}`); setShowDetail(res.data); }}
                  style={{ cursor: 'pointer' }}
                >
                  <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                  <td style={{ fontWeight: 600 }}>{inv.invoiceNumber}</td>
                  <td>{inv.clientId?.name || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{fmt(inv.total)}</td>
                  <td><span className={`badge badge-${inv.paymentStatus}`}>{inv.paymentStatus}</span></td>
                  <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        onClick={async (e) => { e.stopPropagation(); const res = await api.get(`/invoices/${inv._id}`); setShowDetail(res.data); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#64748b', padding: '4px' }}
                        title="View Invoice"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadDirectly(inv._id, inv.invoiceNumber); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#cbd5e1' : '#64748b', padding: '4px' }}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this invoice?')) deleteMutation.mutate(inv._id); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme === 'dark' ? '#f87171' : '#ef4444', padding: '4px' }}
                          title="Delete Invoice"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', padding: '40px' }}>
                    No invoices found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderTop: `1px solid ${theme === 'dark' ? '#334155' : '#f1f5f9'}` }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, background: theme === 'dark' ? '#1e293b' : '#ffffff', color: page === 1 ? (theme === 'dark' ? '#475569' : '#94a3b8') : (theme === 'dark' ? '#f8fafc' : '#0f172a'), cursor: page === 1 ? 'not-allowed' : 'pointer' }}>Previous</button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '8px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, background: theme === 'dark' ? '#1e293b' : '#ffffff', color: page === totalPages ? (theme === 'dark' ? '#475569' : '#94a3b8') : (theme === 'dark' ? '#f8fafc' : '#0f172a'), cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>Next</button>
        </div>
      </div>

      {/* ── Invoice Detail Modal ─────────────────────────────────────────────── */}
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
                  
                  {showDetail.invoice.isRecurring && (
                    <div style={{ gridColumn: '1 / -1', background: theme === 'dark' ? 'rgba(59,130,246,0.1)' : '#eff6ff', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recurring Template</span>
                      <span style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Renews <strong>{showDetail.invoice.recurringInterval}</strong>. Next billing: <strong>{new Date(showDetail.invoice.nextBillingDate).toLocaleDateString()}</strong>.</span>
                    </div>
                  )}
                  {showDetail.invoice.parentInvoiceId && (
                    <div style={{ gridColumn: '1 / -1' }}>
                      <span style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Auto-generated from a recurring template</span>
                    </div>
                  )}
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

                {/* Action buttons */}
                <div className="print-hidden" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" onClick={() => handleDownloadDirectly(showDetail.invoice._id, showDetail.invoice.invoiceNumber)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}>
                      <Download size={14} /> PDF
                    </button>
                    <button
                      className="btn-primary"
                      onClick={() => sendEmailMutation.mutate(showDetail.invoice._id)}
                      disabled={sendEmailMutation.isPending}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px' }}
                    >
                      <Send size={14} /> Send
                    </button>
                    {isAdmin && showDetail.invoice.paymentStatus !== 'paid' && (
                      <button
                        className="btn-primary"
                        onClick={() => logPaymentMutation.mutate({ id: showDetail.invoice._id, total: showDetail.invoice.total, paidAmount: showDetail.invoice.paidAmount })}
                        disabled={logPaymentMutation.isPending}
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', padding: '8px 14px', background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                      >
                        <DollarSign size={14} /> Log Payment
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setShowMoreMenu(v => !v)}
                        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '8px 12px', borderRadius: '10px', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, background: theme === 'dark' ? '#1e293b' : '#f8fafc', color: theme === 'dark' ? '#cbd5e1' : '#64748b', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                      >
                        <MoreHorizontal size={16} />
                      </button>

                      {showMoreMenu && (
                        <div
                          onClick={() => setShowMoreMenu(false)}
                          style={{ position: 'absolute', right: 0, bottom: '44px', background: theme === 'dark' ? '#1e293b' : '#fff', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`, borderRadius: '12px', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 100, minWidth: '180px' }}
                        >
                          {showDetail.invoice.status === 'draft' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: showDetail.invoice._id, status: 'sent' })}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', border: 'none', background: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', color: theme === 'dark' ? '#f8fafc' : '#334155' }}
                              onMouseEnter={e => e.currentTarget.style.background = theme === 'dark' ? '#334155' : '#f1f5f9'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                              <CheckCircle size={14} color="#22c55e" /> Mark as Sent
                            </button>
                          )}
                          {showDetail.invoice.status !== 'overdue' && showDetail.invoice.status !== 'cancelled' && (
                            <button
                              onClick={() => statusMutation.mutate({ id: showDetail.invoice._id, status: 'cancelled' })}
                              style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', border: 'none', background: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', color: '#f59e0b' }}
                              onMouseEnter={e => e.currentTarget.style.background = theme === 'dark' ? '#334155' : '#fef9c3'}
                              onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                              <XCircle size={14} /> Cancel Invoice
                            </button>
                          )}
                          <div style={{ height: '1px', background: theme === 'dark' ? '#334155' : '#f1f5f9', margin: '4px 0' }} />
                          <button
                            onClick={() => { if (confirm('Delete this invoice?')) deleteMutation.mutate(showDetail.invoice._id); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', padding: '9px 12px', border: 'none', background: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', textAlign: 'left', color: '#ef4444' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                          >
                            <Trash2 size={14} /> Delete Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {!isAdmin && (
                    <p style={{ fontSize: '12px', color: theme === 'dark' ? '#94a3b8' : '#94a3b8' }}>View-only</p>
                  )}
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
