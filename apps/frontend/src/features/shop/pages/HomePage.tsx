import { useListings } from '../hooks/useListings';
import { ProductCard } from '../components/ProductCard';
import { useCart } from '../hooks/useCart';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../shared/components/Layout';

export default function HomePage() {
  const { data: listings, isLoading, isError } = useListings();
  const { addItem } = useCart();
  const navigate = useNavigate();

  return (
    <Layout>
      {/* Hero */}
      <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '40vh', background: 'linear-gradient(180deg, #111 0%, var(--bg) 100%)' }}>
        {/* decorative lines */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'repeating-linear-gradient(90deg, var(--gold) 0px, var(--gold) 1px, transparent 1px, transparent 120px)',
        }} />
        <div className="relative text-center px-6 fade-up space-y-4 py-16">
          <p className="text-xs tracking-[0.5em]" style={{ color: 'var(--gold)' }}>LUXURY FRAGRANCE DECANTS</p>
          <h1 className="font-display text-5xl md:text-7xl font-light" style={{ color: 'var(--text)', lineHeight: 1.1 }}>
            The Collection
          </h1>
          <p className="text-sm tracking-widest" style={{ color: 'var(--text-muted)' }}>
            World-class fragrances. Yours to discover.
          </p>
          <div className="pt-2 flex items-center justify-center gap-4">
            <div className="h-px w-16" style={{ background: 'var(--gold-dim)' }} />
            <span className="text-xs tracking-widest" style={{ color: 'var(--gold)' }}>✦</span>
            <div className="h-px w-16" style={{ background: 'var(--gold-dim)' }} />
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs tracking-[0.4em] mb-1" style={{ color: 'var(--gold)' }}>OUR</p>
            <h2 className="font-display text-3xl" style={{ color: 'var(--text)' }}>Fragrances</h2>
          </div>
          <p className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>
            {listings?.length ?? 0} ITEMS
          </p>
        </div>

        {isLoading && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="shimmer" style={{ aspectRatio: '3/4', background: 'var(--bg-card)' }} />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-center py-20">
            <p className="text-sm tracking-widest" style={{ color: 'var(--text-muted)' }}>Failed to load collection.</p>
          </div>
        )}

        {listings && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {listings.map((item, i) => (
              <div key={item.id} className={`fade-up-delay-${Math.min(i % 4, 3) + 1}`} style={{ animationDelay: `${i * 0.05}s` }}>
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
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2" style={{ color: 'var(--text-muted)' }}>No fragrances yet</p>
          </div>
        )}
      </section>

      {/* Brand strip */}
      <section className="border-t border-b py-8 overflow-hidden" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-16 px-6 overflow-x-auto scrollbar-hide">
          {['TOM FORD', 'CREED', 'CHANEL', 'DIOR', 'YSL', 'PRADA', 'ARMANI', 'GUERLAIN', 'MAISON MARGIELA'].map((b) => (
            <span key={b} className="shrink-0 text-xs tracking-[0.4em] whitespace-nowrap" style={{ color: 'var(--text-dim)' }}>
              {b}
            </span>
          ))}
        </div>
      </section>
    </Layout>
  );
}
