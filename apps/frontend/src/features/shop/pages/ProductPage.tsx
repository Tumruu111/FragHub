import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useCart } from '../hooks/useCart';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { QuantityStepper } from '../../../shared/components/QuantityStepper';
import { isSoldOut } from '../../../types/listing';

export const ProductPage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: listing, isLoading, isError } = useListing(id);
  const { items, addItem, openCart, mlLeft } = useCart();
  const [chosenSize, setChosenSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const inCartCount = items
    .filter((i) => i.listing.id === id)
    .reduce((sum, i) => sum + i.quantity, 0);

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

  const outOfStock = isSoldOut(listing);
  // Every size draws from the same bottle, net of what's already in the cart
  const left = Math.max(0, mlLeft(listing));
  const canAdd = (sizeMl: number) => Math.floor(left / sizeMl);
  const fitting = listing.sizes.filter((s) => canAdd(s.sizeMl) > 0);
  const size =
    fitting.find((s) => s.sizeMl === chosenSize) ?? fitting[0] ?? null;
  const maxQty = size ? canAdd(size.sizeMl) : 0;
  const selected = Math.min(quantity, Math.max(maxQty, 1));
  const shownPrice = (size ?? listing.sizes[0])?.price ?? 0;

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
              DECANTS FROM A {listing.bottleMl}ML BOTTLE
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
              {shownPrice.toLocaleString()}₮
            </p>
          </div>

          {listing.sizes.length > 0 && (
            <div>
              <p
                className="text-xs tracking-[0.3em] mb-3"
                style={{ color: 'var(--text-dim)' }}
              >
                SIZE
              </p>
              <div className="flex flex-wrap gap-2" role="radiogroup">
                {listing.sizes.map((s) => {
                  const isSelected = s.sizeMl === size?.sizeMl;
                  const disabled = canAdd(s.sizeMl) < 1;
                  return (
                    <button
                      key={s.sizeMl}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      disabled={disabled}
                      onClick={() => setChosenSize(s.sizeMl)}
                      className="px-4 py-2 text-xs tracking-widest"
                      style={{
                        border: `1px solid ${
                          isSelected ? 'var(--gold)' : 'var(--border)'
                        }`,
                        background: isSelected
                          ? 'rgba(201,168,76,0.08)'
                          : 'transparent',
                        color: disabled
                          ? 'var(--border)'
                          : isSelected
                          ? 'var(--gold)'
                          : 'var(--text-muted)',
                        cursor: disabled ? 'default' : 'pointer',
                      }}
                    >
                      {s.sizeMl}ML · {s.price.toLocaleString()}₮
                    </button>
                  );
                })}
              </div>
            </div>
          )}

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
              {outOfStock
                ? '✕ OUT OF STOCK'
                : size
                ? `✓ ${maxQty} × ${size.sizeMl}ML AVAILABLE`
                : '✓ IN STOCK'}
            </span>
          </div>

          {/* Buying goes through the cart → QPay checkout, never directly. */}
          {outOfStock ? (
            <Button disabled className="w-full" size="lg">
              UNAVAILABLE
            </Button>
          ) : !size ? (
            <div className="space-y-3">
              <p
                className="text-xs tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                ALL THAT&apos;S LEFT OF THIS BOTTLE IS IN YOUR CART
              </p>
              <Button onClick={openCart} className="w-full" size="lg">
                VIEW CART
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {inCartCount > 0 && (
                <p
                  className="text-xs tracking-widest"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {inCartCount} OF THIS PERFUME ALREADY IN YOUR CART
                </p>
              )}
              <div className="flex gap-3">
                <QuantityStepper
                  value={selected}
                  max={maxQty}
                  onChange={setQuantity}
                />
                <Button
                  onClick={() => {
                    addItem(listing, size.sizeMl, selected);
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
