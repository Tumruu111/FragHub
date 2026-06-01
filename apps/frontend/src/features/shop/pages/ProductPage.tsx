import { useParams } from 'react-router-dom';
import { useListings } from '../hooks/useListings';
import { useCart } from '../hooks/userCart';

export const ProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data: listings, isLoading } = useListings();
  const { addItem } = useCart();

  if (isLoading || !listings[0]) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 grid gap-10 md:grid-cols-[1.1fr,1fr]">
      <div className="rounded-3xl bg-slate-50 p-4">
        <img
          src={listings[0].picture}
          alt={listings[0].title}
          className="w-full rounded-2xl object-cover"
        />
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="font-serif text-3xl text-slate-900">
            {listings[0].title}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.2em] text-slate-500">
            {listings[0].size}
          </p>
        </div>

        <div className="text-2xl font-medium text-slate-900">
          {listings[0].price}₮
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-500">
            NOTES
          </p>
          <div className="flex flex-wrap gap-2">
            {listings[0].vibe.map((note: string) => (
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
          onClick={() => addItem()}
          className="mt-4 w-full rounded-full bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-800"
        >
          Add to cart
        </button>

        <p className="text-xs text-slate-500">
          Stock:{' '}
          {listings[0].stock > 0
            ? `${listings[0].stock} available`
            : 'Out of stock'}
        </p>
      </div>
    </div>
  );
};
