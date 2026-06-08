import { useState } from 'react';
import type { FC } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { isAuthenticated, clearToken, getToken } from '../auth/token';
import { api } from '../api';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleAuth = async () => {
    if (authed) {
      try {
        const token = getToken();
        if (token) await api.post('/auth/logout');
      } catch {
        /* best-effort */
      }
      clearToken();
      navigate('/');
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Announcement bar */}
      <div className="announce-bar">FREE SHIPPING ON ORDERS OVER 150,000₮</div>

      {/* Header */}
      <header className="site-header">
        <div className="header-inner">
          {/* Logo */}
          <Link to="/" className="site-logo">
            FRAGHUB
          </Link>

          {/* Nav */}
          <nav className="site-nav">
            {(
              [
                ['/', 'Collection'],
                ['/cart', 'Orders'],
              ] as [string, string][]
            ).map(([path, label]) => (
              <Link
                key={path}
                to={path}
                className="nav-link"
                style={{
                  color:
                    location.pathname === path
                      ? 'var(--gold)'
                      : 'var(--text-muted)',
                }}
              >
                {label}
                {location.pathname === path && (
                  <div className="nav-active-dot" />
                )}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="header-actions">
            <button onClick={handleAuth} className="header-btn">
              <User size={14} />
              <span>{authed ? 'Logout' : 'Login'}</span>
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="header-icon-btn"
              aria-label="Cart"
            >
              <ShoppingBag size={17} />
            </button>
            <button
              className="mobile-menu-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Menu"
            >
              {menuOpen ? <X size={17} /> : <Menu size={17} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="mobile-nav">
            {(
              [
                ['/', 'Collection'],
                ['/cart', 'Orders'],
              ] as [string, string][]
            ).map(([path, label]) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMenuOpen(false)}
                className="mobile-nav-link"
              >
                {label}
              </Link>
            ))}
            <button
              onClick={handleAuth}
              className="mobile-nav-link"
              style={{ color: 'var(--gold)' }}
            >
              {authed ? 'Logout' : 'Login'}
            </button>
          </div>
        )}
      </header>

      {/* Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-logo">FRAGHUB</div>
          <div className="footer-ornament">
            <div className="footer-line" />
            <svg width="10" height="10" viewBox="0 0 10 10">
              <path
                d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z"
                fill="var(--gold-dim)"
              />
            </svg>
            <div className="footer-line" />
          </div>
          <p className="footer-copy">
            © 2026 · Luxury Fragrance Decants · Ulaanbaatar
          </p>
        </div>
      </footer>
    </div>
  );
};
