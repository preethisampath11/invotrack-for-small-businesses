import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Save, Building, Palette, Bell, ShieldAlert, LogOut, Download, Trash2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTheme } from '../context/ThemeContext';

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

const SettingsPage = () => {
  const { api, user, logout } = useAuth();
  const { theme } = useTheme();
  const isAdmin = user?.role === 'admin';
  const { refreshTriggers } = useSocket();
  const [activeTab, setActiveTab] = useState(isAdmin ? 'profile' : 'notifications');
  const [company, setCompany] = useState(null);
  const [scheduledDeletionDate, setScheduledDeletionDate] = useState(null);
  const [originalCurrency, setOriginalCurrency] = useState('USD');
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [convertValues, setConvertValues] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [form, setForm] = useState({
    name: '', phone: '', email: '', taxId: '',
    address: { street: '', city: '', state: '', zip: '', country: '' },
    settings: { currency: 'USD', currencySymbol: '$', taxRate: 0, invoicePrefix: 'INV-', themeColor: '#22c55e', defaultNotes: '', paymentTerms: 'Net 30', lowStockThreshold: 5 },
    preferences: { emailOnPayment: true, emailWeeklySummary: true }
  });

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      setCompany(res.data.company);
      setScheduledDeletionDate(res.data.scheduledDeletionDate);
      const fetchedCurrency = res.data.company.settings?.currency || 'USD';
      setOriginalCurrency(fetchedCurrency);
      setForm({
        name: res.data.company.name || '',
        phone: res.data.company.phone || '',
        email: res.data.company.email || '',
        taxId: res.data.company.taxId || '',
        address: res.data.company.address || {},
        settings: {
          currency: res.data.company.settings?.currency || 'USD',
          currencySymbol: res.data.company.settings?.currencySymbol || '$',
          taxRate: res.data.company.settings?.taxRate || 0,
          invoicePrefix: res.data.company.settings?.invoicePrefix || 'INV-',
          themeColor: res.data.company.settings?.themeColor || '#22c55e',
          defaultNotes: res.data.company.settings?.defaultNotes || '',
          paymentTerms: res.data.company.settings?.paymentTerms || 'Net 30',
          lowStockThreshold: res.data.company.settings?.lowStockThreshold || 5
        },
        preferences: {
          emailOnPayment: res.data.preferences?.emailOnPayment ?? true,
          emailWeeklySummary: res.data.preferences?.emailWeeklySummary ?? true
        }
      });
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSettings(); }, [refreshTriggers.settings]);

  const handleCurrencyChange = (code) => {
    const currency = CURRENCIES.find(c => c.code === code);
    setForm({ ...form, settings: { ...form.settings, currency: code, currencySymbol: currency?.symbol || '$' } });
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    if (form.settings.currency !== originalCurrency && !showCurrencyModal) {
      setShowCurrencyModal(true);
      return;
    }
    submitSettings();
  };

  const submitSettings = async () => {
    setIsSaving(true);
    try {
      const payload = { ...form };
      if (showCurrencyModal) {
        payload.convertCurrency = convertValues;
        payload.oldCurrency = originalCurrency;
      }
      await api.put('/settings', payload);
      toast.success('Settings saved!');
      setOriginalCurrency(form.settings.currency);
      setShowCurrencyModal(false);
    } catch (err) { 
      toast.error('Error saving settings'); 
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const res = await api.post('/settings/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setCompany(res.data.company);
      toast.success('Logo uploaded!');
    } catch (err) { toast.error('Error uploading logo'); }
  };

  // Security Actions
  const handleLogoutAll = async () => {
    if (!confirm('Log out of all other devices? You will be logged out here as well.')) return;
    try {
      await api.post('/settings/security/logout-all');
      toast.success('Logged out of all sessions.');
      logout();
    } catch (err) { toast.error('Error logging out sessions'); }
  };

  const handleExportData = async () => {
    try {
      const res = await api.get('/settings/security/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'invotrack_export.json');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Data export started.');
    } catch (err) { toast.error('Error exporting data'); }
  };

  const handleScheduleDeletion = async () => {
    if (!confirm('Are you sure you want to schedule your account for deletion in 30 days?')) return;
    try {
      const res = await api.post('/settings/security/delete');
      setScheduledDeletionDate(res.data.date);
      toast.success('Account scheduled for deletion.');
    } catch (err) { toast.error('Error scheduling deletion'); }
  };

  const handleCancelDeletion = async () => {
    try {
      await api.post('/settings/security/cancel-delete');
      setScheduledDeletionDate(null);
      toast.success('Account deletion cancelled.');
    } catch (err) { toast.error('Error cancelling deletion'); }
  };

  if (!company) return <div style={{ padding: '40px', textAlign: 'center', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>Loading settings...</div>;

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
        {/* Settings Sidebar Tabs */}
        <div style={{ width: '220px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {isAdmin && (
            <>
              <button onClick={() => setActiveTab('profile')} style={{ ...tabStyle, ...(activeTab === 'profile' ? activeTabStyle : {}) }}>
                <Building size={16} /> Business Profile
              </button>
              <button onClick={() => setActiveTab('invoices')} style={{ ...tabStyle, ...(activeTab === 'invoices' ? activeTabStyle : {}) }}>
                <Palette size={16} /> Invoice & Financial
              </button>
            </>
          )}
          <button onClick={() => setActiveTab('notifications')} style={{ ...tabStyle, ...(activeTab === 'notifications' ? activeTabStyle : {}) }}>
            <Bell size={16} /> Notifications & Alerts
          </button>
          <button onClick={() => setActiveTab('security')} style={{ ...tabStyle, ...(activeTab === 'security' ? activeTabStyle : {}) }}>
            <ShieldAlert size={16} /> Security & Data
          </button>
        </div>

        {/* Settings Content Area */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {activeTab === 'profile' && isAdmin && (
              <div className="stat-card animate-slide-in" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Business Profile</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '14px', background: theme === 'dark' ? '#0f172a' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `2px dashed ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                    {company.logoUrl ? <img src={company.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Building size={28} color="#94a3b8" />}
                  </div>
                  <div>
                    <label className="btn-secondary" style={{ cursor: 'pointer' }}>
                      Upload Logo
                      <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </label>
                    <p style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', marginTop: '4px' }}>PNG, JPG up to 5MB</p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Company Name</label>
                    <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="input-field" />
                  </div>
                  <div>
                    <label className="form-label">Tax ID / VAT</label>
                    <input value={form.taxId} onChange={e => setForm({ ...form, taxId: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="form-label">Business Email</label>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" />
                  </div>
                  <div>
                    <label className="form-label">Phone Number</label>
                    <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label className="form-label">Street Address</label>
                  <input value={form.address.street} onChange={e => setForm({ ...form, address: { ...form.address, street: e.target.value } })} className="input-field" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <input value={form.address.city} onChange={e => setForm({ ...form, address: { ...form.address, city: e.target.value } })} className="input-field" placeholder="City" />
                  <input value={form.address.state} onChange={e => setForm({ ...form, address: { ...form.address, state: e.target.value } })} className="input-field" placeholder="State" />
                  <input value={form.address.zip} onChange={e => setForm({ ...form, address: { ...form.address, zip: e.target.value } })} className="input-field" placeholder="ZIP" />
                  <input value={form.address.country} onChange={e => setForm({ ...form, address: { ...form.address, country: e.target.value } })} className="input-field" placeholder="Country" />
                </div>
              </div>
            )}

            {activeTab === 'invoices' && isAdmin && (
              <div className="stat-card animate-slide-in" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Invoice Preferences</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Default Currency</label>
                    <select value={form.settings.currency} onChange={e => handleCurrencyChange(e.target.value)} className="input-field">
                      {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.symbol} {c.name} ({c.code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Default Tax Rate (%)</label>
                    <input type="number" value={form.settings.taxRate} onChange={e => setForm({ ...form, settings: { ...form.settings, taxRate: Number(e.target.value) } })} min={0} step="0.1" className="input-field" />
                  </div>
                  <div>
                    <label className="form-label">Invoice Prefix</label>
                    <input value={form.settings.invoicePrefix} onChange={e => setForm({ ...form, settings: { ...form.settings, invoicePrefix: e.target.value } })} className="input-field" />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                  <div>
                    <label className="form-label">Default Payment Terms</label>
                    <input value={form.settings.paymentTerms} onChange={e => setForm({ ...form, settings: { ...form.settings, paymentTerms: e.target.value } })} className="input-field" placeholder="e.g. Net 30" />
                  </div>
                  <div>
                    <label className="form-label">Brand Color</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input type="color" value={form.settings.themeColor} onChange={e => setForm({ ...form, settings: { ...form.settings, themeColor: e.target.value } })} style={{ width: '44px', height: '38px', border: 'none', cursor: 'pointer', borderRadius: '8px' }} />
                      <input value={form.settings.themeColor} onChange={e => setForm({ ...form, settings: { ...form.settings, themeColor: e.target.value } })} className="input-field" style={{ flex: 1 }} />
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label className="form-label">Default Invoice Footer / Notes</label>
                  <textarea value={form.settings.defaultNotes} onChange={e => setForm({ ...form, settings: { ...form.settings, defaultNotes: e.target.value } })} className="input-field" rows={3} placeholder="Thank you for your business. Bank details: ..." />
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="stat-card animate-slide-in" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Notifications & Alerts</h2>
                
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#0f172a', marginBottom: '12px' }}>Email Notifications</h3>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.preferences.emailOnPayment} onChange={e => setForm({ ...form, preferences: { ...form.preferences, emailOnPayment: e.target.checked } })} style={{ width: '16px', height: '16px', accentColor: theme === 'dark' ? '#4ade80' : '#16a34a' }} />
                    <span style={{ fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Email me when an invoice is paid</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.preferences.emailWeeklySummary} onChange={e => setForm({ ...form, preferences: { ...form.preferences, emailWeeklySummary: e.target.checked } })} style={{ width: '16px', height: '16px', accentColor: theme === 'dark' ? '#4ade80' : '#16a34a' }} />
                    <span style={{ fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Email me a weekly business summary</span>
                  </label>
                </div>

                {isAdmin && (
                  <div>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: theme === 'dark' ? '#cbd5e1' : '#0f172a', marginBottom: '12px' }}>Inventory Alerts</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>Alert me when stock falls below:</span>
                      <input type="number" value={form.settings.lowStockThreshold} onChange={e => setForm({ ...form, settings: { ...form.settings, lowStockThreshold: Number(e.target.value) } })} min={0} className="input-field" style={{ width: '100px' }} />
                      <span style={{ fontSize: '14px', color: theme === 'dark' ? '#cbd5e1' : '#475569' }}>items</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'security' && (
              <div className="stat-card animate-slide-in" style={{ padding: '24px', border: '1px solid #fecaca' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: theme === 'dark' ? '#ef4444' : '#dc2626' }}>Security & Data (Danger Zone)</h2>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Active Sessions</h4>
                      <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginTop: '4px' }}>Log out of all other devices you might be signed into.</p>
                    </div>
                    <button type="button" onClick={handleLogoutAll} className="btn-secondary" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}><LogOut size={16} /> Log Out All</button>
                  </div>

                  {isAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '20px', borderBottom: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}` }}>
                      <div>
                        <h4 style={{ fontSize: '15px', fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Data Export</h4>
                        <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginTop: '4px' }}>Download all your company data as a JSON file.</p>
                      </div>
                      <button type="button" onClick={handleExportData} className="btn-secondary" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}><Download size={16} /> Export JSON</button>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ fontSize: '15px', fontWeight: 600, color: theme === 'dark' ? '#ef4444' : '#dc2626' }}>Delete Account</h4>
                      <p style={{ fontSize: '13px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginTop: '4px' }}>
                        {scheduledDeletionDate 
                          ? `Scheduled for deletion on ${new Date(scheduledDeletionDate).toLocaleDateString()}` 
                          : 'Schedule your account for deletion. There is a 30-day recovery period.'}
                      </p>
                    </div>
                    {scheduledDeletionDate ? (
                      <button type="button" onClick={handleCancelDeletion} className="btn-secondary" style={{ color: theme === 'dark' ? '#4ade80' : '#16a34a', borderColor: theme === 'dark' ? '#059669' : '#bbf7d0', background: theme === 'dark' ? '#064e3b' : '#f0fdf4' }}><XCircle size={16} /> Cancel Deletion</button>
                    ) : (
                      <button type="button" onClick={handleScheduleDeletion} className="btn-danger"><Trash2 size={16} /> Schedule Deletion</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab !== 'security' && (
              <button type="submit" disabled={isSaving} className="btn-primary" style={{ alignSelf: 'flex-end', padding: '12px 28px', opacity: isSaving ? 0.7 : 1 }}>
                <Save size={16} /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>
      </div>

      {showCurrencyModal && (
        <div className="modal-overlay" onClick={() => setShowCurrencyModal(false)}>
          <div className="modal-content animate-slide-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>Currency Change Detected</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-color, #475569)', marginBottom: '16px', lineHeight: 1.5 }}>
              You are changing the global currency from <strong>{originalCurrency}</strong> to <strong>{form.settings.currency}</strong>.
            </p>
            <div style={{ background: 'var(--border-color, #f8fafc)', padding: '16px', borderRadius: '10px', marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                <input type="checkbox" checked={convertValues} onChange={e => setConvertValues(e.target.checked)} style={{ marginTop: '4px', width: '16px', height: '16px', accentColor: theme === 'dark' ? '#4ade80' : '#16a34a' }} />
                <div>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-color, #0f172a)' }}>Convert existing values using live exchange rates</span>
                  <p style={{ fontSize: '12px', color: theme === 'dark' ? '#cbd5e1' : '#64748b', marginTop: '4px', lineHeight: 1.4 }}>
                    If checked, a {originalCurrency} 100.00 invoice will be mathematically converted to its equivalent value in {form.settings.currency}.<br/>
                    If unchecked, it will simply become {form.settings.currency} 100.00 (the numbers stay exactly the same).
                  </p>
                </div>
              </label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setShowCurrencyModal(false)} className="btn-secondary">Cancel</button>
              <button onClick={submitSettings} disabled={isSaving} className="btn-primary" >
                {isSaving ? 'Applying...' : 'Confirm & Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .form-label { font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 6px; display: block; }
        html.dark .form-label { color: #cbd5e1; }
      `}</style>
    </div>
  );
};

const tabStyle = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '12px 16px', borderRadius: '10px',
  border: 'none', background: 'transparent',
  fontSize: '14px', fontWeight: 600, color: 'var(--text-color, #64748b)',
  cursor: 'pointer', textAlign: 'left',
  transition: 'all 0.2s ease'
};

const activeTabStyle = {
  background: 'var(--color-dark-100, #f1f5f9)',
  color: 'var(--text-color, #0f172a)'
};

export default SettingsPage;
