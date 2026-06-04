import { useAdminStats } from '../hooks/useAdminStats';
import { AdminLayout } from '../components/AdminLayout';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="p-5 space-y-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
    <p className="text-xs tracking-[0.3em]" style={{ color: 'var(--text-dim)' }}>{label}</p>
    <p className="font-display text-3xl" style={{ color: 'var(--text)' }}>{value}</p>
    {sub && <p className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>{sub}</p>}
  </div>
);

const PIE_COLORS = ['#C9A84C', '#6ee7b7', '#f87171'];

export const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useAdminStats();

  if (isLoading) return (
    <AdminLayout>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="shimmer h-24" style={{ background: 'var(--bg-card)' }} />)}
      </div>
    </AdminLayout>
  );

  const orderStatusData = [
    { name: 'Pending', value: stats?.pending ?? 0 },
    { name: 'Completed', value: stats?.completed ?? 0 },
    { name: 'Cancelled', value: stats?.cancelled ?? 0 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p className="text-xs tracking-[0.4em] mb-1" style={{ color: 'var(--gold)' }}>OVERVIEW</p>
          <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>Dashboard</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="LISTINGS" value={stats?.totalListings ?? 0} />
          <StatCard label="IN STOCK" value={stats?.inStock ?? 0} sub={`${stats?.outOfStock ?? 0} out of stock`} />
          <StatCard label="ORDERS" value={stats?.totalOrders ?? 0} />
          <StatCard label="REVENUE" value={`${(stats?.totalRevenue ?? 0).toLocaleString()}₮`} sub="completed only" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs tracking-[0.3em] mb-6" style={{ color: 'var(--text-muted)' }}>ORDERS — LAST 7 DAYS</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={stats?.ordersByDay ?? []} barSize={18}>
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: 'var(--text-dim)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }} cursor={{ fill: 'rgba(201,168,76,0.06)' }} />
                <Bar dataKey="count" fill="var(--gold)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-xs tracking-[0.3em] mb-6" style={{ color: 'var(--text-muted)' }}>ORDER STATUS</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={orderStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                  {orderStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
