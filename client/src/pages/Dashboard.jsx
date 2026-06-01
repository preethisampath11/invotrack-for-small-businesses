import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, FileText, TrendingUp, Package, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { api } = useAuth();
  const { refreshTriggers } = useSocket();
  const { theme } = useTheme();
  const [stats, setStats] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activities, setActivities] = useState([]);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const [dashRes, settingsRes] = await Promise.all([
        api.get('/invoices/dashboard'),
        api.get('/settings')
      ]);
      setStats(dashRes.data.stats);
      setMonthlyData(dashRes.data.monthlyData);
      setActivities(dashRes.data.recentActivities);
      setCurrencySymbol(settingsRes.data.company?.settings?.currencySymbol || '$');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, [refreshTriggers.dashboard, refreshTriggers.activity]);

  const PIE_COLORS = ['#22c55e', '#3b82f6', theme === 'dark' ? '#cbd5e1' : '#64748b', '#ef4444', '#f59e0b'];
  const pieData = stats ? [
    { name: 'Paid', value: stats.paidCount },
    { name: 'Sent', value: stats.pendingCount },
    { name: 'Draft', value: stats.draftCount },
    { name: 'Overdue', value: stats.overdueCount },
    { name: 'Cancelled', value: stats.cancelledCount }
  ].filter(d => d.value > 0) : [];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#22c55e', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '14px' }}>Loading dashboard...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const formatCurrency = (val) => `${currencySymbol}${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Dashboard</h1>
        <p style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: '14px', marginTop: '4px' }}>Welcome back! Here is your business overview.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Invoiced', value: formatCurrency(stats?.totalBilled), icon: FileText, color: '#6366f1', bg: '#eef2ff' },
          { label: 'Payments Received', value: formatCurrency(stats?.totalPaid), icon: DollarSign, color: '#22c55e', bg: '#dcfce7' },
          { label: 'Outstanding', value: formatCurrency(stats?.outstanding), icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Inventory Items', value: stats?.totalItems || 0, icon: Package, color: '#8b5cf6', bg: '#f5f3ff' },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="stat-card"
            style={idx === 0 ? { background: '#6366f1' } : {}}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: idx === 0 ? 'rgba(255,255,255,0.2)' : card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <card.icon size={20} color={idx === 0 ? 'white' : card.color} />
              </div>
              <ArrowUpRight size={16} color={idx === 0 ? 'rgba(255,255,255,0.7)' : theme === 'dark' ? '#cbd5e1' : '#94a3b8'} />
            </div>
            <div style={{ fontSize: '24px', fontWeight: 700, color: idx === 0 ? 'white' : theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '4px' }}>{card.value}</div>
            <div style={{ fontSize: '13px', color: idx === 0 ? 'rgba(255,255,255,0.8)' : theme === 'dark' ? '#94a3b8' : '#64748b' }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Revenue Trend Overview</h3>
              <p style={{ fontSize: '13px', color: theme === 'dark' ? '#94a3b8' : '#64748b', marginTop: '2px' }}>Monthly invoiced vs. received</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#94a3b8', fontSize: 12 }} tickFormatter={v => `${currencySymbol}${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: '13px' }}
                formatter={(val) => [`${currencySymbol}${val.toLocaleString()}`, '']}
              />
              <Bar dataKey="invoiced" fill="#c7d2fe" radius={[8, 8, 0, 0]} name="Invoiced" />
              <Bar dataKey="received" fill="#6366f1" radius={[8, 8, 0, 0]} name="Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '4px' }}>Invoices Overview</h3>
          <div style={{ fontSize: '28px', fontWeight: 800, color: theme === 'dark' ? '#f8fafc' : '#0f172a', marginBottom: '2px' }}>
            {stats?.paidCount}<span style={{ fontSize: '16px', fontWeight: 500, color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>/{stats?.totalInvoices}</span>
          </div>
          <p style={{ fontSize: '12px', color: theme === 'dark' ? '#94a3b8' : '#64748b', marginBottom: '16px' }}>Invoices Processed</p>

          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                  {pieData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: '13px' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', fontSize: '13px' }}>
              No invoices yet
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
            {pieData.map((d, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PIE_COLORS[idx] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={18} color="#64748b" />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Recent Activity</h3>
        </div>
        {activities.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activities.slice(0, 8).map((activity, idx) => (
              <div key={idx} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 14px', borderRadius: '10px',
                background: activity.isAlert ? (theme === 'dark' ? 'rgba(253,224,71,0.1)' : '#fef9c3') : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
                border: activity.isAlert ? `1px solid ${theme === 'dark' ? 'rgba(253,224,71,0.2)' : '#fde68a'}` : `1px solid ${theme === 'dark' ? '#334155' : 'transparent'}`
              }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: theme === 'dark' ? '#f8fafc' : '#334155' }}>{activity.userName}</span>
                  <span style={{ fontSize: '13px', color: theme === 'dark' ? '#94a3b8' : '#64748b' }}> — {activity.details}</span>
                </div>
                <span style={{ fontSize: '11px', color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                  {new Date(activity.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8', fontSize: '14px', textAlign: 'center', padding: '20px' }}>No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
