import { useListings } from '../hooks/useListings';
import { ProductCard } from '../components/ProductCard';
import { useNavigate } from 'react-router-dom';

export default function HomePage() {
  const { data: lists, isLoading } = useListings();
  const navigate = useNavigate();

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="mb-8 font-serif text-3xl text-slate-900">
        FragHub Collection
      </h1>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {lists?.map((item: any) => (
          <ProductCard
            key={item.id}
            id={item.id}
            title={item.title}
            price={item.price}
            picture={item.picture}
            vibes={item.vibe}
            onClick={() => navigate(`/product/${item.id}`)}
            onAddToCart={() => console.log('Add to cart:', item.id)}
          />
        ))}
      </div>
    </div>
  );
}
