import { useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminOrders } from '../hooks/useAdminOrders';
import type { AdminOrder } from '../hooks/useAdminOrders';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import type { Order } from '../../../types/order';
import { monthName } from '../../../types/subscription';

const FILTERS = ['pending', 'completed', 'cancelled', 'all'] as const;
type Filter = (typeof FILTERS)[number];

const statusVariant = (s: Order['status']) =>
  s === 'completed' ? 'success' : s === 'cancelled' ? 'danger' : 'warning';

// 99112233 → 9911 2233
const formatPhone = (p: string) => p.replace(/^(\d{4})(\d{4})$/, '$1 $2');

const errorMessage = (e: unknown) =>
  (e as { response?: { errors?: { message: string }[] } })?.response
    ?.errors?.[0]?.message ?? 'Something went wrong.';

const OrderActions = ({ order }: { order: AdminOrder }) => {
  const { complete, cancel } = useAdminOrders();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');

  const run = async (action: typeof complete, label: string) => {
    setError('');
    try {
      await action.mutateAsync(order.id);
      setConfirming(false);
    } catch (e) {
      setError(`${label}: ${errorMessage(e)}`);
    }
  };

  if (order.status !== 'pending') return null;

  return (
    <div className="flex flex-col items-end gap-2">
      {confirming ? (
        <>
          <p className="text-xs text-right" style={{ color: '#f87171' }}>
            Puts {order.sizeMl}ml back in the bottle. Refund{' '}
            {order.price.toLocaleString()}₮ in QPay yourself.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setConfirming(false)}
            >
              KEEP
            </Button>
            <Button
              size="sm"
              variant="danger"
              loading={cancel.isPending}
              onClick={() => run(cancel, 'Cancel failed')}
            >
              CONFIRM CANCEL
            </Button>
          </div>
        </>
      ) : (
        <div className="flex gap-2">
          <Button
            size="sm"
            loading={complete.isPending}
            onClick={() => run(complete, 'Complete failed')}
          >
            MARK COMPLETED
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => setConfirming(true)}
          >
            CANCEL & REFUND
          </Button>
        </div>
      )}
      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export const AdminOrdersPage = () => {
  const { data: orders, isLoading } = useAdminOrders();
  const [filter, setFilter] = useState<Filter>('pending');
  const shown =
    orders?.filter((o) => filter === 'all' || o.status === filter) ?? [];
  const count = (f: Filter) =>
    orders?.filter((o) => f === 'all' || o.status === f).length ?? 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
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
            Orders
          </h1>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist">
          {FILTERS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 text-xs tracking-widest"
              style={{
                border: `1px solid ${
                  filter === f ? 'var(--gold)' : 'var(--border)'
                }`,
                color: filter === f ? 'var(--gold)' : 'var(--text-muted)',
                background:
                  filter === f ? 'rgba(201,168,76,0.06)' : 'transparent',
              }}
            >
              {f.toUpperCase()} ({count(f)})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="shimmer h-16"
                style={{ background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <p
            className="py-12 text-center text-xs tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            NO {filter === 'all' ? '' : `${filter.toUpperCase()} `}ORDERS
          </p>
        ) : (
          <div className="space-y-2">
            {shown.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center gap-4 p-4"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--bg-card)',
                }}
              >
                {order.listing?.picture && (
                  <img
                    src={order.listing.picture}
                    alt={order.listing.title}
                    className="shrink-0 object-cover"
                    style={{ width: 48, height: 60 }}
                  />
                )}
                <div className="flex-1 min-w-[12rem]">
                  <p
                    className="font-display text-base"
                    style={{ color: 'var(--text)' }}
                  >
                    {order.listing?.title ?? '—'} · {order.sizeMl}ml
                  </p>
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {order.user.name} ·{' '}
                    <a
                      href={`mailto:${order.user.email}`}
                      style={{ color: 'var(--gold)' }}
                    >
                      {order.user.email}
                    </a>
                  </p>
                  {order.delivery ? (
                    <div
                      className="text-xs mt-2 space-y-0.5"
                      style={{ color: 'var(--text)' }}
                    >
                      <p>
                        <a
                          href={`tel:+976${order.delivery.phone}`}
                          style={{ color: 'var(--gold)' }}
                        >
                          {formatPhone(order.delivery.phone)}
                        </a>{' '}
                        · {order.delivery.address}
                      </p>
                      {order.delivery.note && (
                        <p style={{ color: 'var(--text-muted)' }}>
                          Note: {order.delivery.note}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p
                      className="text-xs mt-2"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      No delivery details (ordered before checkout asked)
                    </p>
                  )}
                  <p
                    className="text-xs mt-1"
                    style={{ color: 'var(--text-dim)' }}
                  >
                    {new Date(order.createdAt).toLocaleString('en-US')} · #
                    {order.id.slice(0, 8).toUpperCase()}
                    {order.boxMonth && (
                      <> · {monthName(order.boxMonth)} subscription box</>
                    )}
                    {order.paymentId && (
                      <>
                        {' '}
                        · checkout #{order.paymentId.slice(0, 8).toUpperCase()}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <span
                      className="font-display text-lg"
                      style={{ color: 'var(--gold)' }}
                    >
                      {order.price.toLocaleString()}₮
                    </span>
                    <Badge
                      label={order.status.toUpperCase()}
                      variant={statusVariant(order.status)}
                    />
                  </div>
                  <OrderActions order={order} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
