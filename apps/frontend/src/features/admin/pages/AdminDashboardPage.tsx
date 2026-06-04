import { useAdminStats } from '../hooks/useAdminStats';
import { useNavigate } from 'react-router-dom';
import { clearToken } from '../../../shared/lib/auth';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

const StatCard = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <div className="rounded-2xl bg-white border border-slate-100 p-5 space-y-1">
    <p className="text-xs font-medium uppercase tracking-widest text-slate-400">{label}</p>
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    {sub && <p className="text-xs text-slate-400">{sub}</p>}
  </div>
);

const PIE_COLORS = ['#f59e0b', '#10b981', '#f87171'];

export const AdminDashboardPage = () => {
  const { data: stats, isLoading } = useAdminStats();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearToken();
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse h-24 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const orderStatusData = [
    { name: 'Pending', value: stats?.pending ?? 0 },
    { name: 'Completed', value: stats?.completed ?? 0 },
    { name: 'Cancelled', value: stats?.cancelled ?? 0 },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar + header */}
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-52 flex-col border-r border-slate-100 bg-white px-4 py-6 gap-1 shrink-0">
          <p className="font-serif text-xl text-slate-900 mb-6 px-2">FragHub</p>
          {[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Listings', path: '/admin/listings' },
          ].map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition"
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={handleLogout}
            className="rounded-xl px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-500 md:hidden">
              Logout
            </button>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Listings" value={stats?.totalListings ?? 0} />
            <StatCard label="In Stock" value={stats?.inStock ?? 0} sub={`${stats?.outOfStock ?? 0} out of stock`} />
            <StatCard label="Total Orders" value={stats?.totalOrders ?? 0} />
            <StatCard
              label="Revenue"
              value={`${(stats?.totalRevenue ?? 0).toLocaleString()}₮`}
              sub="from completed orders"
            />
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Orders over last 7 days */}
            <div className="rounded-2xl bg-white border border-slate-100 p-5">
              <p className="text-sm font-medium text-slate-700 mb-4">Orders — Last 7 Days</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.ordersByDay ?? []} barSize={20}>
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="count" fill="#1e293b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Order status breakdown */}
            <div className="rounded-2xl bg-white border border-slate-100 p-5">
              <p className="text-sm font-medium text-slate-700 mb-4">Order Status Breakdown</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {orderStatusData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
