import type { FC } from 'react';

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
  title,
  price,
  picture,
  vibes,
  size,
  status,
  onClick,
  onAddToCart,
}) => {
  const outOfStock = status === 'out_of_order';

  return (
    <div className="pcard" onClick={onClick}>
      {/* Image wrapper */}
      <div className="pcard-img-wrap">
        <img src={picture} alt={title} className="pcard-img" />

        {/* Hover overlay gradient */}
        <div className="pcard-overlay" />

        {/* Corner accents */}
        <div className="corner-tl" />
        <div className="corner-br" />

        {/* Out of stock */}
        {outOfStock && (
          <div className="pcard-oos">
            <span className="oos-text">ÉPUISÉ</span>
          </div>
        )}

        {/* Add to cart slide-up */}
        {!outOfStock && (
          <div className="pcard-add-wrap">
            <button
              className="pcard-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                style={{ marginRight: 6 }}
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              ADD TO CART
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="pcard-info">
        <h3 className="pcard-title">{title}</h3>
        <p className="pcard-size">{size}</p>

        {vibes?.length > 0 && (
          <div className="pcard-vibes">
            {vibes.slice(0, 3).map((v) => (
              <span key={v} className="vibe-tag">
                {v}
              </span>
            ))}
          </div>
        )}

        <div className="pcard-price-row">
          <span className="pcard-price">{price.toLocaleString()}₮</span>
          {!outOfStock && <span className="pcard-avail">In stock</span>}
        </div>
      </div>
    </div>
  );
};
