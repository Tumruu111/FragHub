import { useMyOrders } from '../hooks/useMyOrders';
import { useCancelOrder } from '../hooks/useOrders';
import { Layout } from '../../../shared/components/Layout';
import { Button } from '../../../shared/components/Button';
import { Badge } from '../../../shared/components/Badge';
import type { Order } from '../../../types/order';
import type { FC } from 'react';

const statusVariant = (s: Order['status']) =>
  s === 'completed' ? 'success' : s === 'cancelled' ? 'danger' : 'warning';

const OrderRow: FC<{ order: Order }> = ({ order }) => {
  const listing = order.listing;
  const cancel = useCancelOrder();

  return (
    <div className="flex items-center gap-5 p-5 transition-colors" style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-gold)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
      {listing?.picture && (
        <img src={listing.picture} alt={listing.title}
          className="shrink-0 object-cover"
          style={{ width: 64, height: 80 }} />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg leading-tight" style={{ color: 'var(--text)' }}>{listing?.title ?? '—'}</p>
        <p className="text-xs tracking-widest mt-1" style={{ color: 'var(--text-dim)' }}>{listing?.size}</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
          {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <div className="flex flex-col items-end gap-3 shrink-0">
        <Badge label={order.status.toUpperCase()} variant={statusVariant(order.status)} />
        {listing?.price && (
          <span className="font-display text-lg" style={{ color: 'var(--gold)' }}>{listing.price.toLocaleString()}₮</span>
        )}
        {order.status === 'pending' && (
          <Button variant="danger" size="sm" loading={cancel.isPending} onClick={() => cancel.mutate(order.id)}>
            CANCEL
          </Button>
        )}
      </div>
    </div>
  );
};

export const CartPage = () => {
  const { data: orders, isLoading } = useMyOrders();
  const active = orders?.filter((o) => o.status === 'pending') ?? [];
  const past = orders?.filter((o) => o.status !== 'pending') ?? [];

  return (
    <Layout>
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-10">
        <div>
          <p className="text-xs tracking-[0.4em] mb-2" style={{ color: 'var(--gold)' }}>YOUR</p>
          <h1 className="font-display text-4xl" style={{ color: 'var(--text)' }}>Orders</h1>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="shimmer h-24" style={{ background: 'var(--bg-card)' }} />
            ))}
          </div>
        )}

        {!isLoading && !orders?.length && (
          <div className="text-center py-20">
            <p className="font-display text-2xl mb-2" style={{ color: 'var(--text-muted)' }}>No orders yet</p>
            <p className="text-xs tracking-widest" style={{ color: 'var(--text-dim)' }}>Explore the collection to place your first order.</p>
          </div>
        )}

        {active.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs tracking-[0.4em]" style={{ color: 'var(--gold)' }}>ACTIVE ORDERS</p>
            {active.map((o) => <OrderRow key={o.id} order={o} />)}
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-3">
            <p className="text-xs tracking-[0.4em]" style={{ color: 'var(--text-dim)' }}>HISTORY</p>
            {past.map((o) => <OrderRow key={o.id} order={o} />)}
          </section>
        )}
      </div>
    </Layout>
  );
};
