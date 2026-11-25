import { useState } from 'react';
import type { FC } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import {
  useAdminPreorders,
  usePreorderActions,
  type AdminPreorder,
} from '../hooks/useAdminPreorders';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import {
  PREORDER_STATUS_NAMES,
  shortId,
  type PreorderStatus,
} from '../../../types/order';

// What the admin has to do next, tab by tab
const TABS: { label: string; statuses: PreorderStatus[] }[] = [
  { label: 'TO ORDER', statuses: ['ordering'] },
  { label: 'WAITING FOR THE REST', statuses: ['arrived'] },
  { label: 'TO DELIVER', statuses: ['paid'] },
  { label: 'DELIVERED', statuses: ['delivered'] },
  { label: 'CANCELLED', statuses: ['cancelled'] },
  { label: 'DEPOSIT NOT PAID', statuses: ['awaiting_deposit'] },
];

const NEXT_STEP: Partial<
  Record<PreorderStatus, { label: string; key: 'arrived' | 'delivered' }>
> = {
  ordering: { label: 'ARRIVED IN UB', key: 'arrived' },
  paid: { label: 'DELIVERED', key: 'delivered' },
};

const errorMessage = (e: unknown) =>
  (e as any)?.response?.errors?.[0]?.message ??
  (e instanceof Error ? e.message : String(e));

const formatPhone = (p: string) => p.replace(/^(\d{4})(\d{4})$/, '$1 $2');

const paidSoFar = (p: AdminPreorder) =>
  (p.depositPaidAt ? p.deposit : 0) + (p.paidAt ? p.balance : 0);

const PreorderRow: FC<{ preorder: AdminPreorder }> = ({ preorder: p }) => {
  const actions = usePreorderActions();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [error, setError] = useState('');
  const next = NEXT_STEP[p.status];
  const open = p.status !== 'delivered' && p.status !== 'cancelled';

  const run = async (key: 'arrived' | 'delivered' | 'cancel') => {
    setError('');
    try {
      await actions[key].mutateAsync(p.id);
      setConfirmCancel(false);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div
      className="p-5 space-y-3"
      style={{
        border: `1px solid ${
          p.overdue ? 'rgba(248,113,113,0.4)' : 'var(--border)'
        }`,
        background: 'var(--bg-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-display text-lg" style={{ color: 'var(--text)' }}>
            {p.user.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {p.user.email} ·{' '}
            <a
              href={`tel:+976${p.delivery.phone}`}
              style={{ color: 'var(--gold)' }}
            >
              {formatPhone(p.delivery.phone)}
            </a>
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
            #{shortId(p.id)} · placed{' '}
            {new Date(p.createdAt).toLocaleDateString('en-US')}
            {p.balanceDueBy &&
              p.status === 'arrived' &&
              ` · rest due ${new Date(p.balanceDueBy).toLocaleDateString(
                'en-US'
              )}`}
          </p>
        </div>
        <Badge
          label={(p.overdue ? 'OVERDUE' : PREORDER_STATUS_NAMES[p.status])
            .toString()
            .toUpperCase()}
          variant={
            p.status === 'delivered'
              ? 'success'
              : p.status === 'cancelled' || p.overdue
              ? 'danger'
              : 'warning'
          }
        />
      </div>

      <ul className="text-sm space-y-1" style={{ color: 'var(--text)' }}>
        {p.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3">
            <span>
              {i.title}{' '}
              <span style={{ color: 'var(--text-dim)' }}>· {i.bottleMl}ml</span>
            </span>
            <span style={{ color: 'var(--text-muted)' }}>
              {i.price.toLocaleString()}₮
            </span>
          </li>
        ))}
      </ul>

      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
        Total {p.total.toLocaleString()}₮ · deposit {p.deposit.toLocaleString()}
        ₮ {p.depositPaidAt ? '(paid)' : '(unpaid)'} · rest{' '}
        {p.balance.toLocaleString()}₮ {p.paidAt ? '(paid)' : '(unpaid)'}
      </p>
      {open && (
        <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
          {p.delivery.address}
          {p.delivery.note && ` · ${p.delivery.note}`}
        </p>
      )}

      {open && (
        <div className="flex gap-2 justify-end flex-wrap">
          {confirmCancel ? (
            <>
              <p className="text-xs self-center" style={{ color: '#f87171' }}>
                {paidSoFar(p) > 0
                  ? `They have paid ${paidSoFar(
                      p
                    ).toLocaleString()}₮. Refund it in QPay yourself if you owe it.`
                  : 'Nothing has been paid yet.'}
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmCancel(false)}
              >
                KEEP
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={actions.cancel.isPending}
                onClick={() => run('cancel')}
              >
                CANCEL PRE-ORDER
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setConfirmCancel(true)}
              >
                CANCEL
              </Button>
              {next && (
                <Button
                  size="sm"
                  loading={actions[next.key].isPending}
                  onClick={() => run(next.key)}
                >
                  {next.label}
                </Button>
              )}
            </>
          )}
        </div>
      )}
      {p.status === 'ordering' && (
        <p className="text-xs text-right" style={{ color: 'var(--text-dim)' }}>
          Marking it arrived emails them to pay the rest within 7 days.
        </p>
      )}
      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export const AdminPreordersPage = () => {
  const { data: preorders = [], isLoading } = useAdminPreorders();
  const [tab, setTab] = useState(0);
  const inTab = (i: number) =>
    preorders.filter((p) => TABS[i].statuses.includes(p.status));
  const shown = inTab(tab);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <p
            className="text-xs tracking-[0.4em] mb-1"
            style={{ color: 'var(--gold)' }}
          >
            FULL BOTTLES
          </p>
          <h1
            className="font-display text-3xl"
            style={{ color: 'var(--text)' }}
          >
            Pre-orders
          </h1>
          <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            Order the bottles once the deposit is paid. When they reach UB, mark
            them arrived: the customer is emailed to pay the rest, and you
            deliver once it&apos;s paid.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="tablist">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              role="tab"
              aria-selected={tab === i}
              onClick={() => setTab(i)}
              className="px-3 py-1.5 text-xs tracking-widest"
              style={{
                border: `1px solid ${
                  tab === i ? 'var(--gold)' : 'var(--border)'
                }`,
                color: tab === i ? 'var(--gold)' : 'var(--text-muted)',
              }}
            >
              {t.label} ({inTab(i).length})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div
            className="shimmer h-32"
            style={{ background: 'var(--bg-card)' }}
          />
        ) : shown.length === 0 ? (
          <p
            className="py-12 text-center text-xs tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            NOTHING HERE
          </p>
        ) : (
          <div className="space-y-3">
            {shown.map((p) => (
              <PreorderRow key={p.id} preorder={p} />
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
