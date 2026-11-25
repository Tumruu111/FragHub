import type { FC } from 'react';
import type { Listing } from '../../../types/listing';
import { useCart } from '../hooks/useCart';

type ProductCardProps = {
  listing: Listing;
  onClick: () => void;
};

export const ProductCard: FC<ProductCardProps> = ({ listing, onClick }) => {
  const { title, picture, vibe: vibes, bottleMl, bottlePrice } = listing;
  const { addItem, roomLeft } = useCart();

  return (
    <div className="pcard" onClick={onClick}>
      <div className="pcard-img-wrap">
        <img src={picture} alt={title} className="pcard-img" />

        <div className="pcard-overlay" />

        <div className="corner-tl" />
        <div className="corner-br" />

        {roomLeft > 0 && (
          <div className="pcard-add-wrap">
            <button
              className="pcard-add-btn"
              onClick={(e) => {
                e.stopPropagation();
                addItem(listing);
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
              PRE-ORDER
            </button>
          </div>
        )}
      </div>

      <div className="pcard-info">
        <h3 className="pcard-title">{title}</h3>
        <p className="pcard-size">{bottleMl}ml · full bottle</p>

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
            {(bottlePrice ?? 0).toLocaleString()}₮
          </span>
          <span className="pcard-avail">Pay 50% now</span>
        </div>
      </div>
    </div>
  );
};
