import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/queryKeys';
import { Plus, X, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';

const CreateInvoicePage = () => {
  const { api } = useAuth();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    clientId: '', issueDate: new Date().toISOString().split('T')[0],
    dueDate: '', items: [{ itemId: '', description: '', quantity: 1, rate: 0, tax: 0 }],
    discount: 0, notes: '', isRecurring: false, recurringInterval: 'monthly',
  });
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '' });

  // Clients list — needed for the create-invoice form dropdown
  const { data: clientsData } = useQuery({
    queryKey: queryKeys.clients,
    queryFn: () => api.get('/clients').then(r => r.data),
    staleTime: 2 * 60_000,
  });

  // Items list — needed for the line-item selector in the form
  const { data: itemsData } = useQuery({
    queryKey: queryKeys.items,
    queryFn: () => api.get('/items').then(r => r.data),
    staleTime: 2 * 60_000,
  });

  // Settings — for currency symbol
  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.get('/settings').then(r => r.data),
    staleTime: 5 * 60_000,
  });

  const clients = clientsData?.clients ?? [];
  const items = itemsData?.items ?? [];
  const currencySymbol = settingsData?.company?.settings?.currencySymbol ?? '$';

  const invalidateInvoices = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (data) => api.post('/invoices', data),
    onSuccess: () => {
      invalidateInvoices();
      toast.success('Invoice created!');
      navigate('/invoices');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Error creating invoice'),
  });

  const createClientMutation = useMutation({
    mutationFn: (data) => api.post('/clients', data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clients });
      setForm(prev => ({ ...prev, clientId: res.data.client._id }));
      setIsNewClient(false);
      setNewClient({ name: '', email: '', phone: '', address: '' });
      toast.success('Client created successfully');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create client'),
  });

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

  const fmt = (v) => `${currencySymbol}${(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      background: theme === 'dark' ? '#0f172a' : '#fdfbf7',
      borderColor: state.isFocused ? (theme === 'dark' ? '#22c55e' : '#3a4a53') : (theme === 'dark' ? '#475569' : '#e2e8f0'),
      boxShadow: state.isFocused ? (theme === 'dark' ? '0 0 0 3px rgba(34,197,94,0.15)' : '0 0 0 3px rgba(58,74,83,0.15)') : 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
      borderRadius: '10px',
      padding: '0px',
      color: theme === 'dark' ? '#f8fafc' : '#1e293b',
      fontSize: '13px',
      transition: 'all 0.3s ease',
      cursor: 'text',
      '&:hover': {
        borderColor: theme === 'dark' ? '#22c55e' : '#3a4a53',
      }
    }),
    singleValue: (base) => ({
      ...base,
      color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    }),
    input: (base) => ({
      ...base,
      color: theme === 'dark' ? '#f8fafc' : '#1e293b',
    }),
    menu: (base) => ({
      ...base,
      background: theme === 'dark' ? '#1e293b' : '#ffffff',
      borderRadius: '10px',
      boxShadow: theme === 'dark' ? '0 10px 15px -3px rgba(0,0,0,0.5)' : '0 10px 15px -3px rgba(58,74,83,0.15)',
      border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
      zIndex: 100,
    }),
    option: (base, state) => ({
      ...base,
      background: state.isSelected 
        ? (theme === 'dark' ? '#334155' : '#e2e8f0') 
        : state.isFocused 
          ? (theme === 'dark' ? '#0f172a' : '#f1f5f9') 
          : 'transparent',
      color: theme === 'dark' ? '#f8fafc' : '#1e293b',
      fontSize: '13px',
      cursor: 'pointer',
      '&:active': {
        background: theme === 'dark' ? '#334155' : '#e2e8f0',
      }
    }),
    placeholder: (base) => ({
      ...base,
      color: '#94a3b8',
    }),
  };

  return (
    <div className="animate-fade-in main-container p-4 md:p-8 max-w-screen-md mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate('/invoices')} className="bg-transparent border-none cursor-pointer" style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-2xl font-extrabold" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Create New Invoice</h1>
      </div>

      <form onSubmit={e => { e.preventDefault(); createInvoiceMutation.mutate(form); }} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-[13px] font-semibold" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Client</label>
              <button type="button" onClick={() => setIsNewClient(!isNewClient)} className="bg-transparent border-none text-xs font-semibold cursor-pointer" style={{ color: theme === 'dark' ? '#4ade80' : '#16a34a' }}>
                {isNewClient ? 'Use Existing' : '+ New Client'}
              </button>
            </div>
            {isNewClient ? (
              <div className="p-4 rounded-xl flex flex-col gap-3" style={{ background: theme === 'dark' ? '#0f172a' : '#f8fafc', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                <input value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Client Name *" required className="input-field text-sm px-3.5 py-2.5" />
                <input value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="Email *" type="email" required className="input-field text-sm px-3.5 py-2.5" />
                <input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="Phone" className="input-field text-sm px-3.5 py-2.5" />
                <button
                  type="button"
                  onClick={() => createClientMutation.mutate(newClient)}
                  disabled={createClientMutation.isPending || !newClient.name || !newClient.email}
                  className="btn-primary p-2 text-[13px] flex justify-center mt-1"
                >
                  {createClientMutation.isPending ? 'Saving...' : 'Save Client'}
                </button>
              </div>
            ) : (
              <Select
                value={clients.find(c => c._id === form.clientId) ? { value: form.clientId, label: clients.find(c => c._id === form.clientId).name } : null}
                onChange={option => setForm({ ...form, clientId: option ? option.value : '' })}
                options={clients.map(c => ({ value: c._id, label: c.name }))}
                styles={selectStyles}
                placeholder="Select client..."
                isClearable
              />
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Issue Date</label>
              <input type="date" value={form.issueDate} onChange={e => setForm({ ...form, issueDate: e.target.value })} required className="input-field" />
            </div>
            <div>
              <label className="block text-[13px] font-semibold mb-2" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} required className="input-field" />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold mb-3" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Line Items</label>
          {form.items.map((item, idx) => (
            <div key={idx} className="grid grid-cols-1 md:grid-cols-[2fr_3fr_1fr_1fr_1fr_auto] gap-3 mb-3 items-center">
              <div className="min-w-[160px]">
                <Select
                  value={items.find(i => i._id === item.itemId) ? { value: item.itemId, label: items.find(i => i._id === item.itemId).name } : null}
                  onChange={option => updateLineItem(idx, 'itemId', option ? option.value : '')}
                  options={items.map(i => ({ value: i._id, label: i.name }))}
                  styles={{ ...selectStyles, control: (base, state) => ({ ...selectStyles.control(base, state), fontSize: '13px', minHeight: '40px' }) }}
                  placeholder="Select item..."
                  isClearable
                />
              </div>
              <input value={item.description} onChange={e => updateLineItem(idx, 'description', e.target.value)} placeholder="Description" required className="input-field text-[13px]" />
              <input type="number" value={item.quantity} onChange={e => updateLineItem(idx, 'quantity', Number(e.target.value))} min={1} required className="input-field text-[13px]" placeholder="Qty" />
              <input type="number" value={item.rate} onChange={e => updateLineItem(idx, 'rate', Number(e.target.value))} min={0} step="0.01" required className="input-field text-[13px]" placeholder="Rate" />
              <input type="number" value={item.tax} onChange={e => updateLineItem(idx, 'tax', Number(e.target.value))} min={0} className="input-field text-[13px]" placeholder="Tax %" />
              {form.items.length > 1 && <button type="button" onClick={() => removeLineItem(idx)} className="bg-transparent border-none cursor-pointer flex items-center justify-center p-1" style={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}><X size={18} /></button>}
            </div>
          ))}
          <button type="button" onClick={addLineItem} className="btn-secondary px-4 py-2 text-[13px] mt-2 flex items-center gap-1"><Plus size={16} /> Add Line Item</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Discount ({currencySymbol})</label>
            <input type="number" value={form.discount} onChange={e => setForm({ ...form, discount: Number(e.target.value) })} min={0} step="0.01" className="input-field" />
          </div>
          <div>
            <label className="block text-[13px] font-semibold mb-2" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Notes</label>
            <input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field" placeholder="Optional notes for client" />
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ background: theme === 'dark' ? '#0f172a' : '#f8fafc', border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
          <label className="flex items-center gap-2.5 text-sm font-semibold cursor-pointer" style={{ color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>
            <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({ ...form, isRecurring: e.target.checked })} className="w-4 h-4 cursor-pointer" style={{ accentColor: '#22c55e' }} />
            Set as Recurring Invoice
          </label>
          {form.isRecurring && (
            <select value={form.recurringInterval} onChange={e => setForm({ ...form, recurringInterval: e.target.value })} className="input-field w-40 px-3 py-2 text-sm">
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-end gap-4 md:gap-8 items-end md:items-center p-6 rounded-2xl" style={{ background: theme === 'dark' ? '#0f172a' : '#fbf9f6', border: `1px solid ${theme === 'dark' ? '#334155' : '#e4c5a0'}` }}>
          <div className="text-right text-sm" style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Subtotal:<br/><strong className="text-base" style={{ color: theme === 'dark' ? '#f8fafc' : '#334155' }}>{fmt(calcSubtotal())}</strong></div>
          <div className="text-right text-sm" style={{ color: theme === 'dark' ? '#cbd5e1' : '#64748b' }}>Tax:<br/><strong className="text-base" style={{ color: theme === 'dark' ? '#f8fafc' : '#334155' }}>{fmt(calcTax())}</strong></div>
          <div className="text-right text-lg font-bold" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Total:<br/><span className="text-2xl">{fmt(calcTotal())}</span></div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={() => navigate('/invoices')} className="btn-secondary px-6 py-3 text-[15px]">
            Cancel
          </button>
          <button type="submit" className="btn-primary px-8 py-3 text-[15px]" disabled={createInvoiceMutation.isPending}>
            {createInvoiceMutation.isPending ? 'Saving...' : 'Create Invoice'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateInvoicePage;
