import { useParams } from 'react-router-dom';
import { useListing } from '../hooks/useListings';
import { useCart } from '../hooks/useCart';

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: listing, isLoading } = useListing(id!);
  const { addItem } = useCart();

  if (isLoading || !listing) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 md:grid-cols-[1.1fr,1fr]">
      <div className="rounded-3xl bg-slate-50 p-4">
        <img
          src={listing.picture}
          alt={listing.title}
          className="w-full rounded-2xl object-cover"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">
            {listing.title}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">
            {listing.size}
          </p>
        </div>

        <div className="text-2xl font-medium text-slate-900">
          {listing.price}₮
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">
            NOTES
          </p>
          <div className="flex flex-wrap gap-2">
            {listing.vibe.map((note: string) => (
              <span
                key={note}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-700"
              >
                {note}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => addItem(listing.id)}
          className="mt-4 w-full rounded-full bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add to cart
        </button>

        <p className="text-xs text-slate-500">
          Stock:{' '}
          {listing.stock > 0 ? `${listing.stock} available` : 'Out of stock'}
        </p>
      </div>
    </div>
  );
};
