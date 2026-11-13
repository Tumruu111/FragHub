import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useCart } from '../hooks/useCart';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { QuantityStepper } from '../../../shared/components/QuantityStepper';

export const ProductPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading, isError } = useListing(id);
  const { items, addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const inCartQty = items.find((i) => i.listing.id === id)?.quantity ?? 0;

  if (isLoading) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 md:grid-cols-2">
          <div
            className="shimmer"
            style={{ aspectRatio: '3/4', background: 'var(--bg-card)' }}
          />
          <div className="space-y-4 pt-8">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shimmer h-6"
                style={{
                  background: 'var(--bg-elevated)',
                  width: `${70 - i * 10}%`,
                }}
              />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (isError || !listing) {
    return (
      <Layout>
        <div className="text-center py-32">
          <p
            className="font-display text-2xl mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            Fragrance not found
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            ← Back to Collection
          </Button>
        </div>
      </Layout>
    );
  }

  const outOfStock = listing.status === 'out_of_order' || listing.stock < 1;
  // How many more the buyer can add on top of what's already in their cart
  const remaining = Math.max(0, listing.stock - inCartQty);
  const selected = Math.min(quantity, Math.max(remaining, 1));

  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-6 py-16 grid gap-12 md:grid-cols-[1fr,1fr]">
        <div
          className="fade-up relative overflow-hidden"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
          }}
        >
          <img
            src={listing.picture}
            alt={listing.title}
            className="w-full h-full object-cover"
            style={{ aspectRatio: '3/4' }}
          />
          {outOfStock && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.7)' }}
            >
              <span
                className="text-xs tracking-[0.4em]"
                style={{ color: 'var(--text-muted)' }}
              >
                SOLD OUT
              </span>
            </div>
          )}
        </div>

        <div className="fade-up-delay-1 space-y-8 flex flex-col justify-center">
          <div>
            <button
              onClick={() => navigate('/')}
              className="text-xs tracking-widest mb-6 block transition-colors"
              style={{ color: 'var(--text-dim)' }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = 'var(--gold)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = 'var(--text-dim)')
              }
            >
              ← COLLECTION
            </button>

            <h1
              className="font-display text-4xl md:text-5xl font-light leading-tight"
              style={{ color: 'var(--text)' }}
            >
              {listing.title}
            </h1>
            <p
              className="mt-2 text-xs tracking-[0.4em]"
              style={{ color: 'var(--text-muted)' }}
            >
              {listing.size}
            </p>
          </div>

          <div className="h-px" style={{ background: 'var(--border)' }} />

          <div>
            <p
              className="text-xs tracking-[0.3em] mb-1"
              style={{ color: 'var(--text-dim)' }}
            >
              PRICE
            </p>
            <p
              className="font-display text-4xl"
              style={{ color: 'var(--gold)' }}
            >
              {listing.price.toLocaleString()}₮
            </p>
          </div>

          {listing.vibe?.length > 0 && (
            <div>
              <p
                className="text-xs tracking-[0.3em] mb-3"
                style={{ color: 'var(--text-dim)' }}
              >
                FRAGRANCE NOTES
              </p>
              <div className="flex flex-wrap gap-2">
                {listing.vibe.map((note) => (
                  <span
                    key={note}
                    className="px-3 py-1 text-xs tracking-widest"
                    style={{
                      color: 'var(--gold)',
                      background: 'rgba(201,168,76,0.06)',
                      border: '1px solid rgba(201,168,76,0.2)',
                    }}
                  >
                    {note.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div>
            <span
              className="text-xs tracking-widest"
              style={{ color: outOfStock ? '#f87171' : '#6ee7b7' }}
            >
              {outOfStock ? '✕ OUT OF STOCK' : `✓ ${listing.stock} AVAILABLE`}
            </span>
          </div>

          {/* Buying goes through the cart → QPay checkout, never directly. */}
          {outOfStock ? (
            <Button disabled className="w-full" size="lg">
              UNAVAILABLE
            </Button>
          ) : remaining === 0 ? (
            <div className="space-y-3">
              <p
                className="text-xs tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                ALL {listing.stock} AVAILABLE ARE IN YOUR CART
              </p>
              <Button onClick={openCart} className="w-full" size="lg">
                VIEW CART
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {inCartQty > 0 && (
                <p
                  className="text-xs tracking-widest"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {inCartQty} ALREADY IN YOUR CART
                </p>
              )}
              <div className="flex gap-3">
                <QuantityStepper
                  value={selected}
                  max={remaining}
                  onChange={setQuantity}
                />
                <Button
                  onClick={() => {
                    addItem(listing, selected);
                    setQuantity(1);
                  }}
                  className="flex-1"
                  size="lg"
                >
                  ADD TO CART
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
