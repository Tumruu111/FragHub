import type { Listing, ListingTier, ScentFor } from '../../../types/listing';
import { useUpdateBoxFields } from '../hooks/useAdminListings';

export const TIERS: { value: ListingTier; label: string }[] = [
  { value: 'arabian', label: 'Arabian' },
  { value: 'designer', label: 'Designer' },
  { value: 'niche', label: 'Niche' },
];

export const SCENT_FOR: { value: ScentFor; label: string }[] = [
  { value: 'masculine', label: 'Masculine' },
  { value: 'feminine', label: 'Feminine' },
  { value: 'unisex', label: 'Unisex' },
];

export const selectStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
};

// Which subscription box slot the listing fills, and who it suits. Saves as
// soon as either changes.
export const BoxFieldsCell = ({ listing }: { listing: Listing }) => {
  const update = useUpdateBoxFields();
  return (
    <div className="flex flex-col gap-1">
      <select
        aria-label={`Box tier of ${listing.title}`}
        className="px-2 py-1 text-xs"
        style={selectStyle}
        value={listing.tier}
        disabled={update.isPending}
        onChange={(e) =>
          update.mutate({
            id: listing.id,
            input: { tier: e.target.value as ListingTier },
          })
        }
      >
        {TIERS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <select
        aria-label={`Who ${listing.title} suits`}
        className="px-2 py-1 text-xs"
        style={selectStyle}
        value={listing.scentFor}
        disabled={update.isPending}
        onChange={(e) =>
          update.mutate({
            id: listing.id,
            input: { scentFor: e.target.value as ScentFor },
          })
        }
      >
        {SCENT_FOR.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      {update.isError && (
        <span className="text-xs" style={{ color: '#f87171' }}>
          Not saved
        </span>
      )}
    </div>
  );
};
