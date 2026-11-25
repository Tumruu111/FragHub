import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gql } from 'graphql-request';
import { graphQLClient } from '../../../shared/graphql';
import { Button } from '../../../shared/components/Button';
import type { Listing } from '../../../types/listing';

const UPDATE_BOTTLE_PRICE = gql`
  mutation UpdateBottlePrice($id: ID!, $bottlePrice: Float) {
    updateListing(id: $id, input: { bottlePrice: $bottlePrice }) {
      id
      bottlePrice
    }
  }
`;

// Inline editor for a listing's full-bottle price. Empty stops selling the
// bottle (it can still go in boxes). Enter or SAVE saves; Escape undoes.
export const BottlePriceCell = ({ listing }: { listing: Listing }) => {
  const qc = useQueryClient();
  const update = useMutation({
    mutationFn: (bottlePrice: number | null) =>
      graphQLClient.request(UPDATE_BOTTLE_PRICE, {
        id: listing.id,
        bottlePrice,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['listing', listing.id] });
    },
  });
  const saved = listing.bottlePrice == null ? '' : String(listing.bottlePrice);
  const [value, setValue] = useState(saved);
  const [error, setError] = useState('');

  useEffect(() => setValue(saved), [saved]);

  const parsed = value.trim() === '' ? null : Number(value);
  const valid = parsed === null || (Number.isFinite(parsed) && parsed > 0);
  const dirty = valid && parsed !== listing.bottlePrice;

  const save = async () => {
    if (!dirty) return;
    setError('');
    try {
      await update.mutateAsync(parsed);
    } catch (e: any) {
      setError(e?.response?.errors?.[0]?.message ?? 'Could not save.');
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <input
        type="number"
        min={0}
        value={value}
        placeholder="Not sold"
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setValue(saved);
        }}
        aria-label={`Full bottle price of ${listing.title}`}
        className="px-2 py-1 text-xs outline-none"
        style={{
          width: '7rem',
          background: 'var(--bg-elevated)',
          border: `1px solid ${valid ? 'var(--border)' : '#f87171'}`,
          color: 'var(--text)',
        }}
      />
      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
        ₮
      </span>
      {dirty && (
        <Button size="sm" loading={update.isPending} onClick={save}>
          SAVE
        </Button>
      )}
      {error && (
        <span className="text-xs" style={{ color: '#f87171' }}>
          {error}
        </span>
      )}
    </div>
  );
};
