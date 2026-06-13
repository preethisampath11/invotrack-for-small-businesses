import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { queryKeys } from '../lib/queryKeys';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, FileText, TrendingUp, Package, Clock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { api } = useAuth();
  const { theme } = useTheme();

  // Fetch dashboard stats + recent activity
  const { data: dashData, isLoading: dashLoading, isError: dashError } = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => api.get('/invoices/dashboard').then(r => r.data),
    // Dashboard data refreshes frequently via socket invalidation, but we
    // also set a shorter staleTime here to override the 30s global default.
    staleTime: 15_000,
  });

  // Fetch company settings for currency symbol
  const { data: settingsData } = useQuery({
    queryKey: queryKeys.settings,
    queryFn: () => api.get('/settings').then(r => r.data),
    staleTime: 5 * 60_000, // settings rarely change — 5 min is fine
  });

  const stats = dashData?.stats;
  const monthlyData = dashData?.monthlyData ?? [];
  const activities = dashData?.recentActivities ?? [];
  const currencySymbol = settingsData?.company?.settings?.currencySymbol ?? '$';

  const PIE_COLORS = ['#22c55e', '#3b82f6', theme === 'dark' ? '#cbd5e1' : '#64748b', '#ef4444', '#f59e0b'];
  const pieData = stats
    ? [
        { name: 'Paid', value: stats.paidCount },
        { name: 'Sent', value: stats.pendingCount },
        { name: 'Draft', value: stats.draftCount },
        { name: 'Overdue', value: stats.overdueCount },
        { name: 'Cancelled', value: stats.cancelledCount },
      ].filter(d => d.value > 0)
    : [];

  const formatCurrency = (val) =>
    `${currencySymbol}${(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (dashLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-slate-200 border-t-green-500 rounded-full mx-auto mb-3 animate-spin" />
          <p className="text-sm" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (dashError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-sm" style={{ color: theme === 'dark' ? '#f87171' : '#ef4444' }}>
          Failed to load dashboard. Please refresh the page.
        </p>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { label: 'Total Invoiced', value: formatCurrency(stats?.totalBilled), icon: FileText, color: '#3a4a53', bg: '#fbf9f6' },
          { label: 'Payments Received', value: formatCurrency(stats?.totalPaid), icon: DollarSign, color: '#22c55e', bg: '#dcfce7' },
          { label: 'Outstanding', value: formatCurrency(stats?.outstanding), icon: TrendingUp, color: '#f59e0b', bg: '#fffbeb' },
          { label: 'Inventory Items', value: stats?.totalItems || 0, icon: Package, color: '#8b5cf6', bg: '#fbf9f6' },
        ].map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="stat-card"
            style={idx === 0 ? { background: 'rgba(58, 74, 83, 0.85)', backdropFilter: 'blur(8px)' } : {}}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: idx === 0 ? 'rgba(255,255,255,0.2)' : card.bg }}>
                <card.icon size={20} color={idx === 0 ? 'white' : card.color} />
              </div>
              <ArrowUpRight size={16} color={idx === 0 ? 'rgba(255,255,255,0.7)' : theme === 'dark' ? '#cbd5e1' : '#94a3b8'} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: idx === 0 ? 'white' : theme === 'dark' ? '#f8fafc' : '#0f172a' }}>{card.value}</div>
            <div className="text-[13px]" style={{ color: idx === 0 ? 'rgba(255,255,255,0.8)' : theme === 'dark' ? '#94a3b8' : '#64748b' }}>{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="stat-card p-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-base font-bold" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Revenue Trend Overview</h3>
              <p className="text-[13px] mt-0.5" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>Monthly invoiced vs. received</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#94a3b8', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: theme === 'dark' ? '#cbd5e1' : '#94a3b8', fontSize: 12 }} tickFormatter={v => `${currencySymbol}${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '10px', color: '#f8fafc', fontSize: '13px' }}
                formatter={(val) => [`${currencySymbol}${val.toLocaleString()}`, '']}
              />
              <Bar dataKey="invoiced" fill="#c7d2fe" radius={[8, 8, 0, 0]} name="Invoiced" />
              <Bar dataKey="received" fill="#3a4a53" radius={[8, 8, 0, 0]} name="Received" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="stat-card p-6">
          <h3 className="text-base font-bold mb-1" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Invoices Overview</h3>
          <div className="text-3xl font-extrabold mb-0.5" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>
            {stats?.paidCount}<span className="text-base font-medium" style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>/{stats?.totalInvoices}</span>
          </div>
          <p className="text-xs mb-4" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>Invoices Processed</p>

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
            <div className="h-40 flex items-center justify-center text-[13px]" style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>
              No invoices yet
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {pieData.map((d, idx) => (
              <div key={idx} className="flex items-center gap-1 text-[11px]" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[idx] }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} color="#64748b" />
          <h3 className="text-base font-bold" style={{ color: theme === 'dark' ? '#f8fafc' : '#0f172a' }}>Recent Activity</h3>
        </div>
        {activities.length > 0 ? (
          <div className="flex flex-col gap-2">
            {activities.slice(0, 8).map((activity, idx) => (
              <div key={idx} className="flex justify-between items-center px-3.5 py-2.5 rounded-lg" style={{
                background: activity.isAlert ? (theme === 'dark' ? 'rgba(253,224,71,0.1)' : '#fef9c3') : (theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#f8fafc'),
                border: activity.isAlert ? `1px solid ${theme === 'dark' ? 'rgba(253,224,71,0.2)' : '#fde68a'}` : `1px solid ${theme === 'dark' ? '#334155' : 'transparent'}`
              }}>
                <div>
                  <span className="text-[13px] font-semibold" style={{ color: theme === 'dark' ? '#f8fafc' : '#334155' }}>{activity.userName}</span>
                  <span className="text-[13px]" style={{ color: theme === 'dark' ? '#94a3b8' : '#64748b' }}> — {activity.details}</span>
                </div>
                <span className="text-[11px] whitespace-nowrap ml-3" style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>
                  {new Date(activity.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-center p-5" style={{ color: theme === 'dark' ? '#cbd5e1' : '#94a3b8' }}>No recent activity</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
