import { useState } from 'react';
import { useListings } from '../hooks/useListings';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';

const BRANDS = ['TOM FORD', 'CREED', 'CHANEL', 'DIOR', 'PRADA'];

const LIMIT = 12;

export default function HomePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useListings(page, LIMIT);
  const listings = data?.data;
  const pageInfo = data?.pageInfo;
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="hero-section">
        <div className="hero-photo" />
        <div className="hero-noise" />
        <div className="hero-vignette" />

        <div className="hero-grid" />

        <div className="hero-bar" />

        <div className="hero-content fade-up">
          <div className="hero-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">LUXURY FRAGRANCE DECANTS</span>
            <div className="eyebrow-line" />
          </div>

          <h1 className="hero-title">
            <span className="hero-title-line">The</span>
            <span className="hero-title-main">Collection</span>
          </h1>

          <p className="hero-subtitle">
            World-class fragrances. Yours to discover.
          </p>

          <div className="hero-cta-row">
            <button
              onClick={() =>
                document
                  .getElementById('collection')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              className="hero-cta-btn"
            >
              <span>Explore Now</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                className="cta-arrow"
              >
                <path
                  d="M2 7h10M8 3l4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          <div className="hero-ornament">
            <div className="ornament-line" />
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 1L10.5 7.5L17 9L10.5 10.5L9 17L7.5 10.5L1 9L7.5 7.5Z"
                fill="var(--gold)"
                opacity="0.85"
              />
            </svg>
            <div className="ornament-line" />
          </div>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-line" />
        </div>
      </section>

      <section className="marquee-strip">
        <div className="marquee-track">
          {[...BRANDS, ...BRANDS].map((b, i) => (
            <span key={i} className="marquee-item">
              {b}
              <span className="marquee-dot">◆</span>
            </span>
          ))}
        </div>
      </section>

      <section id="collection" className="collection-section">
        <div className="collection-header fade-up">
          <div className="collection-header-left">
            <span className="section-label">OUR SELECTION</span>
            <h2 className="section-title">Fragrances</h2>
          </div>
          <div className="collection-header-right">
            <span className="item-count">
              {isLoading ? '—' : `${pageInfo?.total ?? 0}`}
              <span className="item-count-label"> PIECES</span>
            </span>
            <div className="header-divider" />
          </div>
        </div>

        {isLoading && (
          <div className="product-grid">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="skeleton-card">
                <div className="skeleton-img shimmer" />
                <div className="skeleton-body">
                  <div
                    className="skeleton-line shimmer"
                    style={{ width: '70%' }}
                  />
                  <div
                    className="skeleton-line shimmer"
                    style={{ width: '40%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {isError && (
          <div className="error-state">
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              style={{ opacity: 0.3 }}
            >
              <circle
                cx="16"
                cy="16"
                r="14"
                stroke="var(--gold)"
                strokeWidth="1"
              />
              <path
                d="M16 10v8M16 22v1"
                stroke="var(--gold)"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
            <p className="error-text">Failed to load the collection.</p>
          </div>
        )}

        {listings && listings.length > 0 && (
          <div className="product-grid">
            {listings.map((item, i) => (
              <div
                key={item.id}
                className="product-cell"
                style={{ animationDelay: `${Math.min(i, 8) * 0.06}s` }}
              >
                <ProductCard
                  id={item.id}
                  title={item.title}
                  price={item.price}
                  picture={item.picture}
                  vibes={item.vibe}
                  size={item.size}
                  status={item.status}
                  onClick={() => navigate(`/product/${item.id}`)}
                  onAddToCart={() => addItem(item)}
                />
              </div>
            ))}
          </div>
        )}

        {listings?.length === 0 && (
          <div className="empty-state">
            <p
              className="font-display"
              style={{
                fontSize: '1.8rem',
                color: 'var(--text-muted)',
                fontWeight: 300,
              }}
            >
              No fragrances yet
            </p>
          </div>
        )}

        {pageInfo && pageInfo.total > LIMIT && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '3rem 0 1rem',
            }}
          >
            <button
              onClick={() => {
                setPage((p) => p - 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!pageInfo.hasPreviousPage}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: pageInfo.hasPreviousPage
                  ? 'var(--text-muted)'
                  : 'var(--border)',
                cursor: pageInfo.hasPreviousPage ? 'pointer' : 'default',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              ← PREV
            </button>

            {Array.from(
              { length: Math.ceil(pageInfo.total / LIMIT) },
              (_, i) => i + 1
            ).map((p) => (
              <button
                key={p}
                onClick={() => {
                  setPage(p);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '2rem',
                  height: '2rem',
                  fontSize: '0.7rem',
                  border:
                    p === page
                      ? '1px solid var(--gold)'
                      : '1px solid var(--border)',
                  background:
                    p === page ? 'rgba(201,168,76,0.08)' : 'transparent',
                  color: p === page ? 'var(--gold)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => {
                setPage((p) => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              disabled={!pageInfo.hasNextPage}
              style={{
                padding: '0.5rem 1.25rem',
                fontSize: '0.65rem',
                letterSpacing: '0.2em',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: pageInfo.hasNextPage
                  ? 'var(--text-muted)'
                  : 'var(--border)',
                cursor: pageInfo.hasNextPage ? 'pointer' : 'default',
                transition: 'color 0.2s, border-color 0.2s',
              }}
            >
              NEXT →
            </button>
          </div>
        )}
      </section>

      <section className="craft-strip fade-up">
        {[
          {
            icon: '◈',
            title: 'Authentic Decants',
            desc: 'Sourced from original flacons',
          },
          {
            icon: '◇',
            title: 'Curated Houses',
            desc: 'Only the finest maisons',
          },
          {
            icon: '◉',
            title: 'Sealed & Secure',
            desc: 'Precision-filled, airtight vials',
          },
        ].map((f) => (
          <div key={f.title} className="craft-item">
            <div className="craft-icon">{f.icon}</div>
            <div>
              <p className="craft-title">{f.title}</p>
              <p className="craft-desc">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>
    </Layout>
  );
}
