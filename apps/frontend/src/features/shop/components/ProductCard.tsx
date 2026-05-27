import { FC } from 'react';

type ProductCardProps = {
  id: string;
  title: string;
  price: string;
  picture: string;
  vibes: string[];
  onClick: () => void;
  onAddToCart: () => void;
};

export const ProductCard: FC<ProductCardProps> = ({
  title,
  price,
  picture,
  vibes,
  onClick,
  onAddToCart,
}) => {
  return (
    <div
      className="group cursor-pointer rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition overflow-hidden"
      onClick={onClick}
    >
      <div className="aspect-[3/4] overflow-hidden">
        <img
          src={picture}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-lg text-slate-900">{title}</h3>
          <span className="text-sm font-medium text-slate-700">{price}₮</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {vibes.map((v) => (
            <span
              key={v}
              className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
            >
              {v}
            </span>
          ))}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart();
          }}
          className="mt-1 w-full rounded-full bg-slate-900 py-2 text-sm font-medium text-white tracking-wide hover:bg-slate-800 transition"
        >
          Add to cart
        </button>
      </div>
    </div>
  );
};
