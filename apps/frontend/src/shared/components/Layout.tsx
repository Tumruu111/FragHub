import { FC, ReactNode, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { isAuthenticated, clearToken } from '../lib/auth';

interface LayoutProps { children: ReactNode; }

export const Layout: FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAuth = () => {
    if (authed) { clearToken(); navigate('/'); }
    else navigate('/login');
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="border-b text-center py-2 text-xs tracking-[0.3em] border-subtle" style={{ color: 'var(--gold)', borderColor: 'var(--border-gold)', background: 'rgba(201,168,76,0.04)' }}>
        FREE SHIPPING ON ORDERS OVER 150,000₮
      </div>

      {/* Main nav */}
      <header className="sticky top-0 z-40 border-b border-subtle backdrop-blur-md" style={{ background: 'rgba(10,10,10,0.92)' }}>
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
          <Link to="/" className="font-display text-2xl tracking-widest" style={{ color: 'var(--gold)', letterSpacing: '0.25em' }}>
            FRAGHUB
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[['/', 'Collection'], ['/cart', 'Orders']].map(([path, label]) => (
              <Link key={path} to={path}
                className="text-xs tracking-[0.2em] transition-colors"
                style={{ color: location.pathname === path ? 'var(--gold)' : 'var(--text-muted)' }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button onClick={handleAuth} className="hidden md:flex items-center gap-2 text-xs tracking-widest transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              <User size={14} />
              {authed ? 'LOGOUT' : 'LOGIN'}
            </button>
            <button onClick={() => navigate('/cart')} className="relative transition-colors" style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--gold)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>
              <ShoppingBag size={18} />
            </button>
            <button className="md:hidden" style={{ color: 'var(--text-muted)' }} onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-subtle px-6 py-4 space-y-4" style={{ background: 'var(--bg-card)' }}>
            {[['/', 'Collection'], ['/cart', 'Orders']].map(([path, label]) => (
              <Link key={path} to={path} onClick={() => setMenuOpen(false)}
                className="block text-xs tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
                {label}
              </Link>
            ))}
            <button onClick={handleAuth} className="block text-xs tracking-[0.2em]" style={{ color: 'var(--gold)' }}>
              {authed ? 'LOGOUT' : 'LOGIN'}
            </button>
          </div>
        )}
      </header>

      <main>{children}</main>

      <footer className="mt-20 border-t border-subtle py-10 text-center" style={{ borderColor: 'var(--border)' }}>
        <p className="font-display text-xl mb-2" style={{ color: 'var(--gold)' }}>FRAGHUB</p>
        <p className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>© 2026 · LUXURY FRAGRANCE DECANTS</p>
      </footer>
    </div>
  );
};
