import { useListings } from '../hooks/useListings';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';

const BRANDS = [
  'TOM FORD',
  'CREED',
  'CHANEL',
  'DIOR',
  'YSL',
  'PRADA',
  'ARMANI',
  'GUERLAIN',
  'MAISON MARGIELA',
];

export default function HomePage() {
  const { data: listings, isLoading, isError } = useListings();
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="hero-section">
        {/* Layered atmosphere */}
        <div className="hero-noise" />
        <div className="hero-vignette" />

        {/* Fine grid lines */}
        <div className="hero-grid" />

        {/* Diagonal accent bar */}
        <div className="hero-bar" />

        <div className="hero-content fade-up">
          {/* Eyebrow */}
          <div className="hero-eyebrow">
            <div className="eyebrow-line" />
            <span className="eyebrow-text">LUXURY FRAGRANCE DECANTS</span>
            <div className="eyebrow-line" />
          </div>

          {/* Main title */}
          <h1 className="hero-title">
            <span className="hero-title-line">The</span>
            <span className="hero-title-main">Collection</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            World-class fragrances. Yours to discover.
          </p>

          {/* CTA */}
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

          {/* Ornament */}
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

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-line" />
        </div>
      </section>

      {/* ── BRAND MARQUEE ────────────────────────────────────── */}
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

      {/* ── COLLECTION ───────────────────────────────────────── */}
      <section id="collection" className="collection-section">
        {/* Section header */}
        <div className="collection-header fade-up">
          <div className="collection-header-left">
            <span className="section-label">OUR SELECTION</span>
            <h2 className="section-title">Fragrances</h2>
          </div>
          <div className="collection-header-right">
            <span className="item-count">
              {isLoading ? '—' : `${listings?.length ?? 0}`}
              <span className="item-count-label"> PIECES</span>
            </span>
            <div className="header-divider" />
          </div>
        </div>

        {/* Grid */}
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
      </section>

      {/* ── CRAFT STRIP ──────────────────────────────────────── */}
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
