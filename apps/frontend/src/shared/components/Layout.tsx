import { useState } from 'react';
import type { FC } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Menu, X } from 'lucide-react';
import { isAuthenticated, clearToken, getToken } from '../auth/token';
import { api } from '../api';
import { useCart } from '../../features/shop/context/CartContext';
import { CartDrawer } from '../../features/shop/components/CartDrawer';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const authed = isAuthenticated();
  const [menuOpen, setMenuOpen] = useState(false);
  const { itemCount, openCart } = useCart();

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
      <CartDrawer />

      <div className="announce-bar">FREE SHIPPING!</div>

      <header className="site-header">
        <div className="header-inner">
          <Link to="/" className="site-logo">
            VERITAS PARFUMS
          </Link>

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

          <div className="header-actions">
            <button onClick={handleAuth} className="header-btn">
              <User size={14} />
              <span>{authed ? 'Logout' : 'Login'}</span>
            </button>
            <button
              onClick={openCart}
              className="header-icon-btn"
              aria-label="Cart"
              style={{ position: 'relative' }}
            >
              <ShoppingBag size={17} />
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-6px',
                    background: 'var(--gold)',
                    color: '#0a0a0a',
                    fontSize: '0.5rem',
                    fontWeight: 700,
                    width: '15px',
                    height: '15px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {itemCount}
                </span>
              )}
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

      <main>{children}</main>

      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-logo">VERITAS PARFUMS</div>
            <p className="footer-tagline">
              World-class fragrance decants,
              <br />
              curated for the discerning nose.
            </p>
            <div className="footer-ornament">
              <div className="footer-line" />
              <svg width="8" height="8" viewBox="0 0 10 10">
                <path
                  d="M5 0L6 4L10 5L6 6L5 10L4 6L0 5L4 4Z"
                  fill="var(--gold-dim)"
                />
              </svg>
              <div className="footer-line" />
            </div>
          </div>

          <div className="footer-col">
            <p className="footer-col-heading">EXPLORE</p>
            <div className="footer-links">
              <Link to="/" className="footer-link">
                Collection
              </Link>
              <Link to="/cart" className="footer-link">
                My Orders
              </Link>
              <Link to="/login" className="footer-link">
                Sign In
              </Link>
              <Link to="/register" className="footer-link">
                Create Account
              </Link>
            </div>
          </div>

          <div className="footer-col">
            <p className="footer-col-heading">CONTACT US</p>
            <div className="footer-links">
              <a
                href="mailto:parfumsveritas@gmail.com"
                className="footer-link footer-contact-item"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                parfumsveritas@gmail.com
              </a>
              <a
                href="tel:+97699028893"
                className="footer-link footer-contact-item"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.58 3.41 2 2 0 0 1 3.55 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.96a16 16 0 0 0 6.13 6.13l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                9902 8893
              </a>
              <span
                className="footer-contact-item"
                style={{
                  color: 'var(--text-dim)',
                  fontSize: '0.62rem',
                  letterSpacing: '0.1em',
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    display: 'inline',
                    marginRight: '8px',
                    verticalAlign: 'middle',
                  }}
                >
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                Ulaanbaatar, Mongolia
              </span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">
            © 2026 Veritas Parfums · Luxury Fragrance Decants
          </p>
        </div>
      </footer>
    </div>
  );
};
