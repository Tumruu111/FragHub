import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useCart } from '../hooks/useCart';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { QuantityStepper } from '../../../shared/components/QuantityStepper';
import { splitPayment } from '../../../types/listing';

export const ProductPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading, isError } = useListing(id);
  const { items, addItem, roomLeft } = useCart();
  const [quantity, setQuantity] = useState(1);
  const inCartCount = items.find((i) => i.listing.id === id)?.quantity ?? 0;

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

  const price = listing.bottlePrice;
  const { deposit } = splitPayment(price ?? 0);
  // One pre-order holds a limited number of bottles
  const selected = Math.min(quantity, Math.max(roomLeft, 1));

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
              {listing.bottleMl}ML · FULL BOTTLE
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
              {(price ?? 0).toLocaleString()}₮
            </p>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Pay {deposit.toLocaleString()}₮ (50%) now and the rest when it
              arrives in UB.
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

          <p
            className="text-xs tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            IMPORTED TO ORDER · USUALLY 1–2 WEEKS
          </p>

          {/* Buying goes through the cart → QPay checkout, never directly. */}
          {price == null ? (
            <Button disabled className="w-full" size="lg">
              NOT AVAILABLE TO ORDER
            </Button>
          ) : (
            <div className="space-y-3">
              {inCartCount > 0 && (
                <p
                  className="text-xs tracking-widest"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {inCartCount} OF THIS BOTTLE ALREADY IN YOUR CART
                </p>
              )}
              <div className="flex gap-3">
                <QuantityStepper
                  value={selected}
                  max={Math.max(roomLeft, 1)}
                  onChange={setQuantity}
                />
                <Button
                  onClick={() => {
                    addItem(listing, selected);
                    setQuantity(1);
                  }}
                  disabled={roomLeft < 1}
                  className="flex-1"
                  size="lg"
                >
                  PRE-ORDER
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};
