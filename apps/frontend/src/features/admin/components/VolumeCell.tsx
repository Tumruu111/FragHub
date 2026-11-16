import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { useUpdateVolume } from '../hooks/useUpdateVolume';
import type { Listing } from '../../../types/listing';

// Inline editor for the ml left in a listing's bottle. Type a new number, then
// press Enter or SAVE; Escape puts the saved value back.
export const VolumeCell = ({ listing }: { listing: Listing }) => {
  const updateVolume = useUpdateVolume();
  const [value, setValue] = useState(String(listing.volumeMl));
  const [error, setError] = useState('');

  // Pick up the new value after a save, a sale or a refetch
  useEffect(() => setValue(String(listing.volumeMl)), [listing.volumeMl]);

  const parsed = Number(value);
  const valid =
    value.trim() !== '' &&
    Number.isInteger(parsed) &&
    parsed >= 0 &&
    parsed <= listing.bottleMl;
  const dirty = valid && parsed !== listing.volumeMl;

  const save = async () => {
    if (!dirty) return;
    setError('');
    try {
      await updateVolume.mutateAsync({ id: listing.id, volumeMl: parsed });
    } catch (e: any) {
      setError(e?.response?.errors?.[0]?.message ?? 'Could not save.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={listing.bottleMl}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setValue(String(listing.volumeMl));
        }}
        aria-label={`Ml left in ${listing.title}`}
        className="px-2 py-1 text-xs outline-none"
        style={{
          width: '4.5rem',
          background: 'var(--bg-elevated)',
          border: `1px solid ${valid ? 'var(--border)' : '#f87171'}`,
          color: 'var(--text)',
        }}
      />
      <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
        / {listing.bottleMl}ml
      </span>
      {dirty && (
        <Button size="sm" loading={updateVolume.isPending} onClick={save}>
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
