import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminListings } from '../hooks/useAdminListings';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

const INITIAL_FORM = { title: '', price: '', size: '', picture: '', vibe: '', stock: '' };

export const AdminListingsPage = () => {
  const navigate = useNavigate();
  const { data: listings, isLoading, createListing, isCreating, deleteListing } = useAdminListings();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');

  const set = (k: keyof typeof INITIAL_FORM) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleCreate = async () => {
    if (!form.title || !form.price || !form.size || !form.picture) {
      setError('Title, price, size and picture are required.');
      return;
    }
    setError('');
    try {
      await createListing({
        title: form.title,
        price: parseFloat(form.price),
        size: form.size,
        picture: form.picture,
        vibe: form.vibe.split(',').map((v) => v.trim()).filter(Boolean),
        stock: parseInt(form.stock) || 0,
        status: 'in_stock',
      });
      setForm(INITIAL_FORM);
      setShowModal(false);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create listing.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex h-screen overflow-hidden">
        <aside className="hidden md:flex w-52 flex-col border-r border-slate-100 bg-white px-4 py-6 gap-1 shrink-0">
          <p className="font-serif text-xl text-slate-900 mb-6 px-2">FragHub</p>
          {[
            { label: 'Dashboard', path: '/admin/dashboard' },
            { label: 'Listings', path: '/admin/listings' },
          ].map(({ label, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition">
              {label}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Listings</h1>
            <Button size="sm" onClick={() => setShowModal(true)}>+ New listing</Button>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse h-12 rounded-xl bg-slate-200" />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Size</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {listings?.map((l) => (
                    <tr key={l.id} className="border-t border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-medium text-slate-800">{l.title}</td>
                      <td className="px-4 py-3 text-slate-600">{l.price}₮</td>
                      <td className="px-4 py-3 text-slate-600">{l.size}</td>
                      <td className="px-4 py-3 text-slate-600">{l.stock}</td>
                      <td className="px-4 py-3">
                        <Badge
                          label={l.status === 'in_stock' ? 'In stock' : 'Out of stock'}
                          variant={l.status === 'in_stock' ? 'success' : 'danger'}
                        />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteListing(l.id)}
                          className="text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!listings?.length && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-400">
                        No listings yet. Create your first one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Create listing modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-slate-900">New Listing</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 text-lg">✕</button>
            </div>

            <div className="space-y-3">
              <Input label="Title" placeholder="Oud & Rose" value={form.title} onChange={set('title')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Price (₮)" type="number" placeholder="49900" value={form.price} onChange={set('price')} />
                <Input label="Stock" type="number" placeholder="10" value={form.stock} onChange={set('stock')} />
              </div>
              <Input label="Size" placeholder="50ml" value={form.size} onChange={set('size')} />
              <Input label="Picture URL" placeholder="https://..." value={form.picture} onChange={set('picture')} />
              <Input label="Notes / Vibes (comma separated)" placeholder="woody, amber, spicy" value={form.vibe} onChange={set('vibe')} />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1" loading={isCreating} onClick={handleCreate}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
