import { useState } from 'react';
import { useAdminListings, useDecantSizes } from '../hooks/useAdminListings';
import { AdminLayout } from '../components/AdminLayout';
import { VolumeCell } from '../components/VolumeCell';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

const INITIAL_FORM = {
  title: '',
  picture: '',
  vibe: '',
  bottleMl: '',
  volumeMl: '',
};

export const AdminListingsPage = () => {
  const {
    data: listings,
    isLoading,
    createListing,
    isCreating,
    deleteListing,
  } = useAdminListings();
  const { data: decantSizes = [] } = useDecantSizes();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  // Price per decant size, keyed by ml
  const [prices, setPrices] = useState<Record<number, string>>({});
  const [error, setError] = useState('');

  const set =
    (k: keyof typeof INITIAL_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const bottleMl = parseInt(form.bottleMl) || 0;
  // ML LEFT defaults to a full bottle
  const volumeMl = form.volumeMl === '' ? bottleMl : parseInt(form.volumeMl);

  const closeModal = () => {
    setForm(INITIAL_FORM);
    setPrices({});
    setError('');
    setShowModal(false);
  };

  const handleCreate = async () => {
    if (!form.title || !form.picture || !bottleMl) {
      setError('Title, picture and bottle size are required.');
      return;
    }
    if (decantSizes.some((ml) => !(parseFloat(prices[ml]) > 0))) {
      setError('Set a price for every size.');
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
        sizes: decantSizes.map((sizeMl) => ({
          sizeMl,
          price: parseFloat(prices[sizeMl]),
        })),
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
                  {['TITLE', 'ML LEFT', 'SIZES', 'STATUS', ''].map((h) => (
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
                    <td className="px-4 py-3">
                      <VolumeCell listing={l} />
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {l.sizes.length === 0
                        ? 'No prices set'
                        : l.sizes.map((s) => (
                            <div key={s.sizeMl}>
                              {s.sizeMl}ml ·{' '}
                              <span style={{ color: 'var(--gold)' }}>
                                {s.price.toLocaleString()}₮
                              </span>{' '}
                              · {s.available} left
                            </div>
                          ))}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        label={
                          l.status === 'in_stock' ? 'IN STOCK' : 'SOLD OUT'
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
                      colSpan={5}
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
                label="ML LEFT"
                type="number"
                placeholder={form.bottleMl || 'Full bottle'}
                value={form.volumeMl}
                onChange={set('volumeMl')}
              />
            </div>

            <div className="space-y-3">
              <p
                className="text-xs tracking-[0.2em]"
                style={{ color: 'var(--text-muted)' }}
              >
                PRICE PER DECANT (₮)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {decantSizes.map((sizeMl) => (
                  <Input
                    key={sizeMl}
                    label={`${sizeMl}ML`}
                    type="number"
                    placeholder="0"
                    value={prices[sizeMl] ?? ''}
                    onChange={(e) =>
                      setPrices((p) => ({ ...p, [sizeMl]: e.target.value }))
                    }
                  />
                ))}
              </div>
              {/* What the bottle works out to, e.g. 100ml → 50 × 2ml */}
              {volumeMl > 0 && (
                <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                  {volumeMl}ml makes{' '}
                  {decantSizes
                    .map((ml) => `${Math.floor(volumeMl / ml)} × ${ml}ml`)
                    .join(', ')}{' '}
                  — sizes share the bottle, so selling one lowers the others.
                </p>
              )}
            </div>

            <Input
              label="PICTURE URL"
              placeholder="https://..."
              value={form.picture}
              onChange={set('picture')}
            />
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
