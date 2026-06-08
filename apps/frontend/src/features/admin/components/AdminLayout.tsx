import type { ReactNode } from 'react';
import type { FC } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { clearToken } from '../../../shared/auth';
import { api } from '../../../shared/api';

const NAV = [
  { label: 'DASHBOARD', path: '/admin/dashboard' },
  { label: 'LISTINGS', path: '/admin/listings' },
];

export const AdminLayout: FC<{ children: ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await api.post('/admin/logout');
    } catch (_) {
      // logout failure shouldn't block redirect
    }
    clearToken();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className="hidden md:flex w-52 flex-col shrink-0 border-r py-6 px-4 gap-1"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <button
          onClick={() => navigate('/')}
          className="font-display text-xl tracking-[0.3em] mb-8 px-2 text-left"
          style={{ color: 'var(--gold)' }}
        >
          FRAGHUB
        </button>

        {NAV.map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="rounded px-3 py-2.5 text-left text-xs tracking-[0.2em] transition-colors"
            style={{
              color:
                location.pathname === path
                  ? 'var(--gold)'
                  : 'var(--text-muted)',
              background:
                location.pathname === path
                  ? 'rgba(201,168,76,0.06)'
                  : 'transparent',
            }}
          >
            {label}
          </button>
        ))}

        <div className="flex-1" />
        <button
          onClick={handleLogout}
          className="rounded px-3 py-2.5 text-left text-xs tracking-[0.2em] transition-colors"
          style={{ color: 'var(--text-dim)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f87171')}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = 'var(--text-dim)')
          }
        >
          LOGOUT
        </button>
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b"
        style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}
      >
        <span
          className="font-display text-lg tracking-widest"
          style={{ color: 'var(--gold)' }}
        >
          FRAGHUB
        </span>
        <div className="flex gap-4">
          {NAV.map(({ label, path }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="text-xs tracking-widest"
              style={{
                color:
                  location.pathname === path
                    ? 'var(--gold)'
                    : 'var(--text-dim)',
              }}
            >
              {label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="text-xs tracking-widest"
            style={{ color: '#f87171' }}
          >
            OUT
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 md:p-8 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
};
