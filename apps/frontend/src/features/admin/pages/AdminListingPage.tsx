import { useState } from 'react';
import { useAdminListings } from '../hooks/useAdminListings';
import { AdminLayout } from '../components/AdminLayout';
import { VolumeCell } from '../components/VolumeCell';
import { BottlePriceCell } from '../components/BottlePriceCell';
import {
  BoxFieldsCell,
  SCENT_FOR,
  TIERS,
  selectStyle,
} from '../components/BoxFieldsCell';
import type { ListingTier, ScentFor } from '../../../types/listing';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

const INITIAL_FORM = {
  title: '',
  picture: '',
  vibe: '',
  bottleMl: '',
  volumeMl: '',
  bottlePrice: '',
  tier: 'designer' as ListingTier,
  scentFor: 'unisex' as ScentFor,
};

export const AdminListingsPage = () => {
  const {
    data: listings,
    isLoading,
    createListing,
    isCreating,
    deleteListing,
  } = useAdminListings();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  const set =
    (k: keyof typeof INITIAL_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const bottleMl = parseInt(form.bottleMl) || 0;
  // ML LEFT defaults to a full bottle
  const volumeMl = form.volumeMl === '' ? bottleMl : parseInt(form.volumeMl);

  const closeModal = () => {
    setForm(INITIAL_FORM);
    setError('');
    setShowModal(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.picture || !bottleMl) {
      setError('Title, picture and bottle size are required.');
      return;
    }
    // Empty means the bottle is only used for boxes, not sold
    const bottlePrice =
      form.bottlePrice === '' ? null : parseFloat(form.bottlePrice);
    if (bottlePrice !== null && !(bottlePrice > 0)) {
      setError('Bottle price must be above 0, or empty.');
      return;
    }
    setError('');
    try {
      await createListing({
        title: form.title,
        picture: form.picture,
        vibe: form.vibe
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean),
        bottleMl,
        volumeMl,
        tier: form.tier,
        scentFor: form.scentFor,
        bottlePrice,
      });
      closeModal();
    } catch (e: any) {
      setError(
        e?.response?.errors?.[0]?.message ?? 'Failed to create listing.'
      );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-xs tracking-[0.4em] mb-1"
              style={{ color: 'var(--gold)' }}
            >
              MANAGE
            </p>
            <h1
              className="font-display text-3xl"
              style={{ color: 'var(--text)' }}
            >
              Listings
            </h1>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>
            + NEW LISTING
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shimmer h-12"
                style={{ background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        ) : (
          <div
            className="overflow-x-auto"
            style={{ border: '1px solid var(--border)' }}
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {[
                    'TITLE',
                    'BOTTLE PRICE',
                    'ML LEFT',
                    'BOX',
                    'STATUS',
                    '',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs tracking-[0.2em]"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings?.map((l) => (
                  <tr
                    key={l.id}
                    style={{
                      borderTop: '1px solid var(--border)',
                      background: 'var(--bg-card)',
                    }}
                  >
                    <td
                      className="px-4 py-3 font-display text-base"
                      style={{ color: 'var(--text)' }}
                    >
                      {l.title}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      <BottlePriceCell listing={l} />
                    </td>
                    <td className="px-4 py-3">
                      <VolumeCell listing={l} />
                    </td>
                    <td className="px-4 py-3">
                      <BoxFieldsCell listing={l} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={
                          l.status === 'in_stock' ? 'FOR BOXES' : 'NO ML LEFT'
                        }
                        variant={l.status === 'in_stock' ? 'success' : 'danger'}
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => deleteListing(l.id)}
                      >
                        DELETE
                      </Button>
                    </td>
                  </tr>
                ))}
                {!listings?.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-xs tracking-widest"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      NO LISTINGS YET
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)' }}
        >
          <div
            className="w-full max-w-md p-8 space-y-5 overflow-y-auto"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-gold)',
              maxHeight: '90vh',
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="font-display text-2xl"
                style={{ color: 'var(--text)' }}
              >
                New Listing
              </h2>
              <button
                onClick={closeModal}
                className="text-xs tracking-widest"
                style={{ color: 'var(--text-dim)' }}
              >
                ✕ CLOSE
              </button>
            </div>
            <Input
              label="TITLE"
              placeholder="Dior Sauvage EDT"
              value={form.title}
              onChange={set('title')}
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="BOTTLE SIZE (ML)"
                type="number"
                placeholder="100"
                value={form.bottleMl}
                onChange={set('bottleMl')}
              />
              <Input
                label="ML LEFT (OPENED)"
                type="number"
                placeholder={form.bottleMl || 'Full bottle'}
                value={form.volumeMl}
                onChange={set('volumeMl')}
              />
            </div>

            <Input
              label="FULL BOTTLE PRICE (₮)"
              type="number"
              placeholder="Leave empty if not sold as a bottle"
              value={form.bottlePrice}
              onChange={set('bottlePrice')}
            />
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Customers pre-order it at this price and pay half up front. ML
              LEFT is what's in our opened bottle for subscription boxes; put 0
              if we haven't opened one.
            </p>

            <Input
              label="PICTURE URL"
              placeholder="https://..."
              value={form.picture}
              onChange={set('picture')}
            />
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  ['tier', 'BOX TIER', TIERS],
                  ['scentFor', 'SUITS', SCENT_FOR],
                ] as const
              ).map(([field, label, options]) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`new-${field}`}
                    className="text-xs tracking-[0.2em]"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {label}
                  </label>
                  <select
                    id={`new-${field}`}
                    className="w-full px-4 py-3 text-sm"
                    style={selectStyle}
                    value={form[field]}
                    onChange={set(field)}
                  >
                    {options.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <Input
              label="NOTES (comma separated)"
              placeholder="woody, amber, spicy"
              value={form.vibe}
              onChange={set('vibe')}
            />
            {error && (
              <p
                className="text-xs tracking-widest"
                style={{ color: '#f87171' }}
              >
                {error}
              </p>
            )}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={closeModal}>
                CANCEL
              </Button>
              <Button
                className="flex-1"
                loading={isCreating}
                onClick={handleCreate}
              >
                CREATE
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
