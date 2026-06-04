import { useState } from 'react';
import { useAdminListings } from '../hooks/useAdminListings';
import { AdminLayout } from '../components/AdminLayout';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

const INITIAL_FORM = { title: '', price: '', size: '', picture: '', vibe: '', stock: '' };

export const AdminListingsPage = () => {
  const { data: listings, isLoading, createListing, isCreating, deleteListing } = useAdminListings();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  const set = (k: keyof typeof INITIAL_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title || !form.price || !form.size || !form.picture) { setError('Title, price, size and picture are required.'); return; }
    setError('');
    try {
      await createListing({
        title: form.title, price: parseFloat(form.price), size: form.size,
        picture: form.picture, vibe: form.vibe.split(',').map(v => v.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0, status: 'in_stock',
      });
      setForm(INITIAL_FORM); setShowModal(false);
    } catch (e: any) { setError(e?.response?.data?.message ?? 'Failed to create listing.'); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-[0.4em] mb-1" style={{ color: 'var(--gold)' }}>MANAGE</p>
            <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>Listings</h1>
          </div>
          <Button size="sm" onClick={() => setShowModal(true)}>+ NEW LISTING</Button>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => <div key={i} className="shimmer h-12" style={{ background: 'var(--bg-card)' }} />)}
          </div>
        ) : (
          <div className="overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['TITLE', 'PRICE', 'SIZE', 'STOCK', 'STATUS', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs tracking-[0.2em]" style={{ color: 'var(--text-dim)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {listings?.map(l => (
                  <tr key={l.id} style={{ borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
                    <td className="px-4 py-3 font-display text-base" style={{ color: 'var(--text)' }}>{l.title}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--gold)' }}>{l.price.toLocaleString()}₮</td>
                    <td className="px-4 py-3 text-xs tracking-widest" style={{ color: 'var(--text-muted)' }}>{l.size}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{l.stock}</td>
                    <td className="px-4 py-3">
                      <Badge label={l.status === 'in_stock' ? 'IN STOCK' : 'SOLD OUT'} variant={l.status === 'in_stock' ? 'success' : 'danger'} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="danger" size="sm" onClick={() => deleteListing(l.id)}>DELETE</Button>
                    </td>
                  </tr>
                ))}
                {!listings?.length && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>NO LISTINGS YET</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div className="w-full max-w-md p-8 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-gold)' }}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl" style={{ color: 'var(--text)' }}>New Listing</h2>
              <button onClick={() => setShowModal(false)} className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>✕ CLOSE</button>
            </div>
            <Input label="TITLE" placeholder="Oud & Rose" value={form.title} onChange={set('title')} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="PRICE (₮)" type="number" placeholder="49900" value={form.price} onChange={set('price')} />
              <Input label="STOCK" type="number" placeholder="10" value={form.stock} onChange={set('stock')} />
            </div>
            <Input label="SIZE" placeholder="50ml" value={form.size} onChange={set('size')} />
            <Input label="PICTURE URL" placeholder="https://..." value={form.picture} onChange={set('picture')} />
            <Input label="NOTES (comma separated)" placeholder="woody, amber, spicy" value={form.vibe} onChange={set('vibe')} />
            {error && <p className="text-xs tracking-widest" style={{ color: '#f87171' }}>{error}</p>}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>CANCEL</Button>
              <Button className="flex-1" loading={isCreating} onClick={handleCreate}>CREATE</Button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
