import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { useUpdatePrices } from '../hooks/useUpdatePrices';
import type { Listing } from '../../../types/listing';

// Shows a listing's decant sizes (price · how many left) with an inline
// editor for the prices. Every fixed size must have a price.
export const SizesCell = ({
  listing,
  decantSizes,
}: {
  listing: Listing;
  decantSizes: number[];
}) => {
  const updatePrices = useUpdatePrices();
  const [editing, setEditing] = useState(false);
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const startEditing = () => {
    setPrices(
      Object.fromEntries(
        decantSizes.map((ml) => [
          ml,
          String(listing.sizes.find((s) => s.sizeMl === ml)?.price ?? ''),
        ])
      )
    );
    setError('');
    setEditing(true);
  };

  const save = async () => {
    if (decantSizes.some((ml) => !(parseFloat(prices[ml]) > 0))) {
      setError('Every size needs a price above 0.');
      return;
    }
    setError('');
    try {
      await updatePrices.mutateAsync({
        id: listing.id,
        sizes: decantSizes.map((sizeMl) => ({
          sizeMl,
          price: parseFloat(prices[sizeMl]),
        })),
      });
      setEditing(false);
    } catch (e: any) {
      setError(e?.response?.errors?.[0]?.message ?? 'Could not save prices.');
    }
  };

  if (editing)
    return (
      <div className="space-y-2">
        {decantSizes.map((ml) => (
          <label key={ml} className="flex items-center gap-2">
            <span style={{ width: '2.5rem' }}>{ml}ml</span>
            <input
              type="number"
              min={0}
              value={prices[ml] ?? ''}
              onChange={(e) =>
                setPrices((p) => ({ ...p, [ml]: e.target.value }))
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') setEditing(false);
              }}
              aria-label={`${ml}ml price for ${listing.title}`}
              className="px-2 py-1 text-xs outline-none"
              style={{
                width: '6rem',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
              }}
            />
            <span>₮</span>
          </label>
        ))}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(false)}>
            CANCEL
          </Button>
          <Button size="sm" loading={updatePrices.isPending} onClick={save}>
            SAVE
          </Button>
        </div>
        {error && <p style={{ color: '#f87171' }}>{error}</p>}
      </div>
    );

  return (
    <div className="space-y-1">
      {listing.sizes.length === 0
        ? 'No prices set'
        : listing.sizes.map((s) => (
            <div key={s.sizeMl}>
              {s.sizeMl}ml ·{' '}
              <span style={{ color: 'var(--gold)' }}>
                {s.price.toLocaleString()}₮
              </span>{' '}
              · {s.available} left
            </div>
          ))}
      <button
        type="button"
        onClick={startEditing}
        className="text-xs tracking-widest underline"
        style={{ color: 'var(--text-dim)' }}
      >
        EDIT PRICES
      </button>
    </div>
  );
};
