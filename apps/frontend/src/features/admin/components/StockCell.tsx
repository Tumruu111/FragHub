import { useEffect, useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { useUpdateStock } from '../hooks/useUpdateStock';
import type { Listing } from '../../../types/listing';

// Inline stock editor for the admin listings table. Type a new number, then
// press Enter or SAVE; Escape puts the saved value back.
export const StockCell = ({ listing }: { listing: Listing }) => {
  const updateStock = useUpdateStock();
  const [value, setValue] = useState(String(listing.stock));
  const [error, setError] = useState('');

  // Pick up the new value after a save or a refetch
  useEffect(() => setValue(String(listing.stock)), [listing.stock]);

  const parsed = Number(value);
  const valid = value.trim() !== '' && Number.isInteger(parsed) && parsed >= 0;
  const dirty = valid && parsed !== listing.stock;

  const save = async () => {
    if (!dirty) return;
    setError('');
    try {
      await updateStock.mutateAsync({ id: listing.id, stock: parsed });
    } catch (e: any) {
      setError(e?.response?.errors?.[0]?.message ?? 'Could not save stock.');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min={0}
        step={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') setValue(String(listing.stock));
        }}
        aria-label={`Stock for ${listing.title}`}
        className="px-2 py-1 text-xs outline-none"
        style={{
          width: '4.5rem',
          background: 'var(--bg-elevated)',
          border: `1px solid ${valid ? 'var(--border)' : '#f87171'}`,
          color: 'var(--text)',
        }}
      />
      {dirty && (
        <Button size="sm" loading={updateStock.isPending} onClick={save}>
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
