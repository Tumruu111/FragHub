import { useState } from 'react';
import type { ReactNode } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { selectStyle } from '../components/BoxFieldsCell';
import { useAdminListings } from '../hooks/useAdminListings';
import {
  useBoxActions,
  useSubscribers,
  useSubscriptionMonth,
  type AdminBox,
} from '../hooks/useAdminSubscriptions';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import type { Listing } from '../../../types/listing';
import {
  FOR_NAMES,
  PLAN_NAMES,
  TIER_NAMES,
  monthName,
} from '../../../types/subscription';

const Stat = ({ label, value }: { label: string; value: ReactNode }) => (
  <div
    className="p-4"
    style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
  >
    <p
      className="text-xs tracking-[0.2em]"
      style={{ color: 'var(--text-dim)' }}
    >
      {label}
    </p>
    <p className="font-display text-2xl mt-1" style={{ color: 'var(--text)' }}>
      {value}
    </p>
  </div>
);

const BoxCard = ({ box, listings }: { box: AdminBox; listings: Listing[] }) => {
  const { swap, confirm } = useBoxActions();
  const [error, setError] = useState('');
  const editable = box.status === 'proposed';
  const ready = box.items.every((i) => i.listing);

  const act = async (run: () => Promise<unknown>) => {
    setError('');
    try {
      await run();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <div
      className="p-4 space-y-3"
      style={{
        border: `1px solid ${
          ready || !editable ? 'var(--border)' : 'rgba(248,113,113,0.4)'
        }`,
        background: 'var(--bg-card)',
      }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p
            className="font-display text-base"
            style={{ color: 'var(--text)' }}
          >
            {box.subscription.user.name}
          </p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {PLAN_NAMES[box.subscription.plan]} ·{' '}
            {FOR_NAMES[box.subscription.forWhom]} ·{' '}
            {box.subscription.user.email}
          </p>
        </div>
        <Badge
          label={
            editable ? (ready ? 'TO CHECK' : 'NEEDS A SCENT') : 'CONFIRMED'
          }
          variant={editable ? (ready ? 'warning' : 'danger') : 'success'}
        />
      </div>

      <div className="space-y-2">
        {box.items.map((item) => {
          // Only same-tier bottles with enough ml can go in the slot
          const options = listings.filter(
            (l) =>
              l.tier === item.tier &&
              (l.volumeMl >= item.sizeMl || l.id === item.listing?.id)
          );
          return (
            <div key={item.id} className="flex items-center gap-3 flex-wrap">
              <span
                className="text-xs tracking-widest w-20"
                style={{ color: 'var(--text-dim)' }}
              >
                {TIER_NAMES[item.tier].toUpperCase()}
              </span>
              {editable ? (
                <select
                  aria-label={`${TIER_NAMES[item.tier]} decant for ${
                    box.subscription.user.name
                  }`}
                  className="px-2 py-1 text-sm flex-1 min-w-[12rem]"
                  style={{
                    ...selectStyle,
                    borderColor: item.listing ? 'var(--border)' : '#f87171',
                  }}
                  value={item.listing?.id ?? ''}
                  disabled={swap.isPending}
                  onChange={(e) =>
                    act(() =>
                      swap.mutateAsync({
                        itemId: item.id,
                        listingId: e.target.value,
                      })
                    )
                  }
                >
                  {!item.listing && (
                    <option value="">
                      Nothing in stock fitted — choose one
                    </option>
                  )}
                  {options.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.title} ({l.scentFor}, {l.volumeMl}ml left)
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  {item.listing?.title ?? '—'}
                </span>
              )}
              <span className="text-xs" style={{ color: 'var(--text-dim)' }}>
                {item.sizeMl}ml
              </span>
            </div>
          );
        })}
      </div>

      {editable && (
        <div className="flex justify-end">
          <Button
            size="sm"
            disabled={!ready}
            loading={confirm.isPending}
            onClick={() => act(() => confirm.mutateAsync({ boxId: box.id }))}
          >
            CONFIRM BOX
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

export const AdminSubscriptionsPage = () => {
  const { data: month, isLoading } = useSubscriptionMonth();
  const { data: subscribers = [] } = useSubscribers();
  const { data: listings = [] } = useAdminListings();
  const { sendInvoices, propose } = useBoxActions();
  const [notice, setNotice] = useState('');

  const boxes = month?.boxes ?? [];
  const toCheck = boxes.filter((b) => b.status === 'proposed');
  const active = subscribers.filter((s) => s.status === 'active');
  const waitlist = subscribers.filter((s) => s.status === 'waitlist');

  const runAction = async (
    action: typeof sendInvoices,
    done: (n: number) => string
  ) => {
    if (!month) return;
    setNotice('');
    try {
      const result = (await action.mutateAsync({
        month: month.month,
      })) as Record<string, number>;
      setNotice(done(Object.values(result)[0] ?? 0));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <p
            className="text-xs tracking-[0.4em] mb-1"
            style={{ color: 'var(--gold)' }}
          >
            SUBSCRIPTIONS
          </p>
          <h1
            className="font-display text-3xl"
            style={{ color: 'var(--text)' }}
          >
            {month ? `${monthName(month.month)} boxes` : 'Boxes'}
          </h1>
          <p className="text-xs mt-2" style={{ color: 'var(--text-dim)' }}>
            Invoices are emailed on the 1st and boxes are picked from the 3rd,
            automatically. Check and confirm them here, then ship by the 5th.
            Late payers (until the 20th) are picked up the same way.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="ACTIVE" value={active.length} />
          <Stat
            label="PAID THIS MONTH"
            value={month ? `${month.paid} / ${month.invoices}` : '—'}
          />
          <Stat label="BOXES TO CHECK" value={toCheck.length} />
          <Stat label="PREMIUM WAITLIST" value={waitlist.length} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="outline"
            loading={sendInvoices.isPending}
            onClick={() =>
              runAction(sendInvoices, (n) =>
                n
                  ? `Sent ${n} invoice${n === 1 ? '' : 's'}.`
                  : "Everyone already has this month's invoice."
              )
            }
          >
            SEND INVOICES NOW
          </Button>
          <Button
            size="sm"
            variant="outline"
            loading={propose.isPending}
            onClick={() =>
              runAction(propose, (n) =>
                n
                  ? `Picked ${n} box${n === 1 ? '' : 'es'}.`
                  : 'Every paid subscriber already has a box.'
              )
            }
          >
            PICK BOXES NOW
          </Button>
          {notice && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {notice}
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            className="shimmer h-32"
            style={{ background: 'var(--bg-card)' }}
          />
        ) : boxes.length === 0 ? (
          <p
            className="py-12 text-center text-xs tracking-widest"
            style={{ color: 'var(--text-dim)' }}
          >
            NO BOXES YET THIS MONTH
          </p>
        ) : (
          <div className="space-y-3">
            {[...toCheck, ...boxes.filter((b) => b.status === 'confirmed')].map(
              (b) => (
                <BoxCard key={b.id} box={b} listings={listings} />
              )
            )}
          </div>
        )}

        <section className="space-y-3">
          <p
            className="text-xs tracking-[0.4em]"
            style={{ color: 'var(--text-dim)' }}
          >
            SUBSCRIBERS
          </p>
          <div
            className="overflow-x-auto"
            style={{ border: '1px solid var(--border)' }}
          >
            <table className="min-w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-elevated)' }}>
                  {['NAME', 'PLAN', 'FOR', 'STATUS', 'THIS MONTH'].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs tracking-[0.2em]"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => {
                  const invoice = s.invoices.find(
                    (i) => i.month === month?.month
                  );
                  return (
                    <tr
                      key={s.id}
                      style={{
                        borderTop: '1px solid var(--border)',
                        background: 'var(--bg-card)',
                      }}
                    >
                      <td
                        className="px-4 py-3"
                        style={{ color: 'var(--text)' }}
                      >
                        {s.user.name}
                        <span
                          className="block text-xs"
                          style={{ color: 'var(--text-dim)' }}
                        >
                          {s.delivery.phone}
                        </span>
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {PLAN_NAMES[s.plan]}
                      </td>
                      <td
                        className="px-4 py-3"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {FOR_NAMES[s.forWhom]}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          label={s.status.toUpperCase()}
                          variant={
                            s.status === 'active'
                              ? 'success'
                              : s.status === 'cancelled'
                              ? 'danger'
                              : 'warning'
                          }
                        />
                      </td>
                      <td
                        className="px-4 py-3 text-xs"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        {invoice
                          ? invoice.paid
                            ? 'Paid'
                            : 'Not paid yet'
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
                {subscribers.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-12 text-center text-xs tracking-widest"
                      style={{ color: 'var(--text-dim)' }}
                    >
                      NO SUBSCRIBERS YET
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminLayout>
  );
};
