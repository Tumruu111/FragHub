import type { FC } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../../shared/components/Layout';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { PaymentModal } from '../components/PaymentModal';
import { usePayment } from '../hooks/usePayment';
import { useCancelMyPreorder, useMyPreorders } from '../hooks/usePreorders';
import {
  PREORDER_STATUS_NAMES,
  PREORDER_STEPS,
  shortId,
  type Preorder,
} from '../../../types/order';

const dateText = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const statusVariant = (p: Preorder) =>
  p.status === 'delivered'
    ? 'success'
    : p.status === 'cancelled' || p.overdue
    ? 'danger'
    : 'warning';

// Deposit → Ordered → In UB → Paid → Delivered, with the steps done so far lit
const Steps: FC<{ preorder: Preorder }> = ({ preorder }) => {
  const reached = PREORDER_STEPS.findIndex((s) => s.status === preorder.status);
  return (
    <ol className="flex gap-1" aria-label="Pre-order progress">
      {PREORDER_STEPS.map((s, i) => {
        const done = i <= reached;
        return (
          <li
            key={s.status}
            className="flex-1 text-center"
            aria-current={i === reached ? 'step' : undefined}
          >
            <div
              className="h-1 mb-1"
              style={{ background: done ? 'var(--gold)' : 'var(--border)' }}
            />
            <span
              className="text-[10px] tracking-widest"
              style={{ color: done ? 'var(--gold)' : 'var(--text-dim)' }}
            >
              {s.label.toUpperCase()}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

const PreorderCard: FC<{
  preorder: Preorder;
  onPay: (paymentId: string) => void;
  paying: boolean;
}> = ({ preorder: p, onPay, paying }) => {
  const cancel = useCancelMyPreorder();
  const open = p.status !== 'delivered' && p.status !== 'cancelled';

  return (
    <div
      className="p-5 space-y-4"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p
            className="text-xs tracking-[0.3em]"
            style={{ color: 'var(--text-dim)' }}
          >
            PRE-ORDER #{shortId(p.id)} · {dateText(p.createdAt)}
          </p>
          <p
            className="font-display text-2xl mt-1"
            style={{ color: 'var(--gold)' }}
          >
            {p.total.toLocaleString()}₮
          </p>
        </div>
        <Badge
          label={(p.overdue
            ? 'Overdue — pay the rest'
            : PREORDER_STATUS_NAMES[p.status]
          ).toUpperCase()}
          variant={statusVariant(p)}
        />
      </div>

      {p.status !== 'cancelled' && <Steps preorder={p} />}

      <div className="space-y-2">
        {p.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4">
            {item.picture && (
              <img
                src={item.picture}
                alt={item.title}
                className="shrink-0 object-cover"
                style={{ width: 40, height: 50 }}
              />
            )}
            <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>
              {item.title}
              <span
                className="block text-xs"
                style={{ color: 'var(--text-dim)' }}
              >
                {item.bottleMl}ml full bottle
              </span>
            </span>
            <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
              {item.price.toLocaleString()}₮
            </span>
          </div>
        ))}
      </div>

      <div
        className="grid grid-cols-2 gap-3 text-xs pt-3"
        style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        <span>
          Deposit (50%): {p.deposit.toLocaleString()}₮
          {p.depositPaidAt ? ' · paid' : ''}
        </span>
        <span>
          The rest: {p.balance.toLocaleString()}₮{p.paidAt ? ' · paid' : ''}
        </span>
      </div>

      {p.due && (
        <div
          className="p-4 space-y-3"
          style={{ border: '1px solid var(--border-gold)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text)' }}>
            {p.due.kind === 'deposit'
              ? 'Pay the 50% deposit and we’ll order your bottles.'
              : `Your bottles are in UB. Pay the rest${
                  p.balanceDueBy ? ` by ${dateText(p.balanceDueBy)}` : ''
                } and we’ll deliver them.`}
          </p>
          <div className="flex gap-3 flex-wrap">
            <Button
              size="sm"
              disabled={paying}
              onClick={() => onPay(p.due!.id)}
            >
              PAY {p.due.amount.toLocaleString()}₮ WITH QPAY
            </Button>
            {p.status === 'awaiting_deposit' && (
              <Button
                size="sm"
                variant="outline"
                loading={cancel.isPending}
                onClick={() => cancel.mutate(p.id)}
              >
                CANCEL
              </Button>
            )}
          </div>
        </div>
      )}

      {open && (
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          Delivering to {p.delivery.address} · {p.delivery.phone}
        </p>
      )}
    </div>
  );
};

export const OrdersPage = () => {
  const { data: preorders, isLoading } = useMyPreorders();
  const { status, payment, error, payPreorder, reset } = usePayment();
  const qc = useQueryClient();
  const active =
    preorders?.filter(
      (p) => p.status !== 'delivered' && p.status !== 'cancelled'
    ) ?? [];
  const past = preorders?.filter((p) => !active.includes(p)) ?? [];

  const pay = (paymentId: string) =>
    payPreorder(paymentId, () => {
      qc.invalidateQueries({ queryKey: ['preorders'] });
      setTimeout(reset, 2000);
    });

  const paying = status === 'creating' || status === 'pending';

  return (
    <Layout>
      <PaymentModal
        status={status}
        payment={payment}
        error={error}
        onCancel={reset}
      />
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-10">
        <div>
          <p
            className="text-xs tracking-[0.4em] mb-2"
            style={{ color: 'var(--gold)' }}
          >
            YOUR
          </p>
          <h1
            className="font-display text-4xl"
            style={{ color: 'var(--text)' }}
          >
            Orders
          </h1>
          <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            Full bottles you pre-ordered. Your subscription boxes are on your
            subscription page.
          </p>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                className="shimmer h-40"
                style={{ background: 'var(--bg-card)' }}
              />
            ))}
          </div>
        )}

        {!isLoading && !preorders?.length && (
          <div className="text-center py-20">
            <p
              className="font-display text-2xl mb-2"
              style={{ color: 'var(--text-muted)' }}
            >
              No orders yet
            </p>
            <p
              className="text-xs tracking-widest"
              style={{ color: 'var(--text-dim)' }}
            >
              Pre-order a full bottle from the collection.
            </p>
          </div>
        )}

        {active.length > 0 && (
          <section className="space-y-3">
            <p
              className="text-xs tracking-[0.4em]"
              style={{ color: 'var(--gold)' }}
            >
              IN PROGRESS
            </p>
            {active.map((p) => (
              <PreorderCard
                key={p.id}
                preorder={p}
                onPay={pay}
                paying={paying}
              />
            ))}
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Need to change or cancel a paid pre-order? Contact us at{' '}
              <a
                href="mailto:parfumsveritas@gmail.com"
                style={{ color: 'var(--gold)' }}
              >
                parfumsveritas@gmail.com
              </a>{' '}
              or{' '}
              <a href="tel:+97699028893" style={{ color: 'var(--gold)' }}>
                9902 8893
              </a>
              .
            </p>
          </section>
        )}

        {past.length > 0 && (
          <section className="space-y-3">
            <p
              className="text-xs tracking-[0.4em]"
              style={{ color: 'var(--text-dim)' }}
            >
              HISTORY
            </p>
            {past.map((p) => (
              <PreorderCard
                key={p.id}
                preorder={p}
                onPay={pay}
                paying={paying}
              />
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
};
