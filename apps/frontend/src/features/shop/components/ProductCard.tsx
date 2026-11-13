import type { FC } from 'react';
import { isSoldOut } from '../../../types/listing';
import type { Listing } from '../../../types/listing';

type ProductCardProps = {
  listing: Listing;
  onClick: () => void;
};

export const ProductCard: FC<ProductCardProps> = ({ listing, onClick }) => {
  const { title, picture, vibe: vibes, sizes } = listing;
  const outOfStock = isSoldOut(listing);
  const fromPrice = sizes.length ? Math.min(...sizes.map((s) => s.price)) : 0;

  return (
    <div className="pcard" onClick={onClick}>
      <div className="pcard-img-wrap">
        <img src={picture} alt={title} className="pcard-img" />

        <div className="pcard-overlay" />

        <div className="corner-tl" />
        <div className="corner-br" />

        {outOfStock && (
          <div className="pcard-oos">
            <span className="oos-text">ÉPUISÉ</span>
          </div>
        )}

        {!outOfStock && (
          <div className="pcard-add-wrap">
            {/* Decants come in several sizes, so choose one on the product page */}
            <button
              className="pcard-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
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
              CHOOSE SIZE
            </button>
          </div>
        )}
      </div>

      <div className="pcard-info">
        <h3 className="pcard-title">{title}</h3>
        <p className="pcard-size">
          {sizes.map((s) => `${s.sizeMl}ml`).join(' · ')}
        </p>

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
          <span className="pcard-price">
            {sizes.length > 1 && 'from '}
            {fromPrice.toLocaleString()}₮
          </span>
          {!outOfStock && <span className="pcard-avail">In stock</span>}
        </div>
      </div>
    </div>
  );
};
