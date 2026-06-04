import { FC } from 'react';

type ProductCardProps = {
  id: string;
  title: string;
  price: number;
  picture: string;
  vibes: string[];
  size: string;
  status: 'in_stock' | 'out_of_order';
  onClick: () => void;
  onAddToCart: () => void;
};

export const ProductCard: FC<ProductCardProps> = ({
  title, price, picture, vibes, size, status, onClick, onAddToCart,
}) => {
  const outOfStock = status === 'out_of_order';

  return (
    <div
      className="group cursor-pointer fade-up"
      onClick={onClick}
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ aspectRatio: '3/4' }}>
        <img
          src={picture}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)' }} />

        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.6)' }}>
            <span className="text-xs tracking-[0.25em]" style={{ color: 'var(--text-muted)' }}>SOLD OUT</span>
          </div>
        )}

        {/* Add to cart on hover */}
        {!outOfStock && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
              className="w-full py-3 text-xs tracking-[0.25em] font-medium transition-opacity"
              style={{ background: 'linear-gradient(135deg, #8a6f2e, #C9A84C, #E8C97A, #C9A84C)', color: '#0a0a0a' }}
            >
              ADD TO CART
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 space-y-2">
        <h3 className="font-display text-base leading-tight" style={{ color: 'var(--text)', fontSize: '1.05rem' }}>
          {title}
        </h3>
        <p className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>{size}</p>

        {vibes?.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {vibes.slice(0, 3).map((v) => (
              <span key={v} className="text-xs px-2 py-0.5" style={{ color: 'var(--gold)', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
                {v}
              </span>
            ))}
          </div>
        )}

        <div className="pt-2">
          <span className="font-display text-lg" style={{ color: 'var(--gold)' }}>
            {price.toLocaleString()}₮
          </span>
        </div>
      </div>
    </div>
  );
};
