import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '../../../shared/components/Layout';
import { Badge } from '../../../shared/components/Badge';
import { Button } from '../../../shared/components/Button';
import { isAuthenticated } from '../../../shared/auth/token';
import { PaymentModal } from '../../shop/components/PaymentModal';
import { usePayment } from '../../shop/hooks/usePayment';
import {
  DeliveryForm,
  deliveryErrors,
  loadSavedDelivery,
  saveDelivery,
} from '../../shop/components/DeliveryForm';
import {
  useCancelSubscription,
  useMySubscription,
  useSubscribe,
  useSubscriptionPlans,
} from '../hooks/useSubscription';
import type { Delivery } from '../../../types/order';
import {
  FOR_NAMES,
  PLAN_NAMES,
  TIER_NAMES,
  monthName,
  type SubscriberFor,
  type Subscription,
  type SubscriptionPlan,
} from '../../../types/subscription';

const errorMessage = (e: unknown) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data
    ?.message ?? 'Something went wrong. Please try again.';

const Heading = ({ eyebrow, title }: { eyebrow: string; title: string }) => (
  <div>
    <p
      className="text-xs tracking-[0.4em] mb-2"
      style={{ color: 'var(--gold)' }}
    >
      {eyebrow}
    </p>
    <h1 className="font-display text-4xl" style={{ color: 'var(--text)' }}>
      {title}
    </h1>
  </div>
);

const Panel = ({ children }: { children: ReactNode }) => (
  <div
    className="p-6 space-y-4"
    style={{ border: '1px solid var(--border)', background: 'var(--bg-card)' }}
  >
    {children}
  </div>
);

const Choice = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    role="radio"
    aria-checked={selected}
    onClick={onClick}
    className="flex-1 p-4 text-left transition-colors"
    style={{
      border: `1px solid ${selected ? 'var(--gold)' : 'var(--border)'}`,
      background: selected ? 'rgba(201,168,76,0.06)' : 'var(--bg-card)',
    }}
  >
    {children}
  </button>
);

type Pay = ReturnType<typeof usePayment>['payInvoice'];

// Choosing a plan, who it's for and where to send it, then paying month one
const SignUp = ({ pay }: { pay: Pay }) => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: plans = [] } = useSubscriptionPlans();
  const subscribe = useSubscribe();
  const [plan, setPlan] = useState<SubscriptionPlan>('base');
  const [forWhom, setForWhom] = useState<SubscriberFor | null>(null);
  const [delivery, setDelivery] = useState<Delivery>(loadSavedDelivery);
  const [errors, setErrors] = useState<Partial<Delivery>>({});
  const [error, setError] = useState('');
  const chosen = plans.find((p) => p.plan === plan);

  const submit = async () => {
    if (!isAuthenticated()) {
      navigate('/login');
      return;
    }
    const found = deliveryErrors(delivery);
    setErrors(found);
    if (!forWhom) return setError('Choose who the boxes are for.');
    if (Object.keys(found).length) return setError('');
    setError('');
    saveDelivery(delivery);
    try {
      const result = await subscribe.mutateAsync({ plan, forWhom, delivery });
      if (result.invoiceId)
        pay(result.invoiceId, () =>
          qc.invalidateQueries({ queryKey: ['subscription'] })
        );
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  return (
    <div className="space-y-8">
      <Heading eyebrow="MONTHLY" title="The Decant Box" />
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Two new 5ml decants every month, chosen for you. Never the same scent
        twice. Pay each month with QPay; skip a month by simply not paying.
      </p>

      <section className="space-y-3">
        <p
          className="text-xs tracking-[0.3em]"
          style={{ color: 'var(--text-dim)' }}
        >
          PLAN
        </p>
        <div className="flex flex-col sm:flex-row gap-3" role="radiogroup">
          {plans.map((p) => (
            <Choice
              key={p.plan}
              selected={plan === p.plan}
              onClick={() => setPlan(p.plan)}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-display text-xl"
                  style={{ color: 'var(--text)' }}
                >
                  {PLAN_NAMES[p.plan]}
                </span>
                {!p.open && <Badge label="WAITLIST" variant="gold" />}
              </div>
              <p
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {p.tiers.map((t) => `1 ${TIER_NAMES[t]}`).join(' + ')}
              </p>
              <p
                className="font-display text-lg mt-2"
                style={{ color: 'var(--gold)' }}
              >
                {p.price.toLocaleString()}₮ / month
              </p>
            </Choice>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p
          className="text-xs tracking-[0.3em]"
          style={{ color: 'var(--text-dim)' }}
        >
          WHO IS IT FOR?
        </p>
        <div className="flex gap-3" role="radiogroup">
          {(['him', 'her', 'either'] as SubscriberFor[]).map((f) => (
            <Choice
              key={f}
              selected={forWhom === f}
              onClick={() => setForWhom(f)}
            >
              <span className="text-sm" style={{ color: 'var(--text)' }}>
                {FOR_NAMES[f]}
              </span>
            </Choice>
          ))}
        </div>
      </section>

      <DeliveryForm
        id="subscribe-form"
        value={delivery}
        errors={errors}
        onChange={setDelivery}
        onSubmit={submit}
      />

      {error && (
        <p className="text-xs" style={{ color: '#f87171' }}>
          {error}
        </p>
      )}

      <Button
        type="submit"
        form="subscribe-form"
        className="w-full"
        loading={subscribe.isPending}
      >
        {chosen?.open === false
          ? `JOIN THE ${PLAN_NAMES[plan].toUpperCase()} WAITLIST`
          : `SUBSCRIBE — PAY ${
              chosen?.price.toLocaleString() ?? ''
            }₮ WITH QPAY`}
      </Button>
    </div>
  );
};

const statusBadge = (s: Subscription) =>
  s.status === 'active' ? (
    <Badge label="ACTIVE" variant="success" />
  ) : s.status === 'pending' ? (
    <Badge label="AWAITING FIRST PAYMENT" variant="warning" />
  ) : s.status === 'waitlist' ? (
    <Badge label="ON THE WAITLIST" variant="gold" />
  ) : (
    <Badge label="CANCELLED" variant="danger" />
  );

// A subscriber's plan, what's due, their boxes and cancelling
const Overview = ({
  subscription: s,
  pay,
}: {
  subscription: Subscription;
  pay: Pay;
}) => {
  const qc = useQueryClient();
  const cancel = useCancelSubscription();
  const [confirming, setConfirming] = useState(false);
  const due = s.invoices.find((i) => !i.paid && i.canPay);
  const refresh = () => qc.invalidateQueries({ queryKey: ['subscription'] });

  return (
    <div className="space-y-6">
      <Heading eyebrow="YOUR" title="Subscription" />

      <Panel>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span
            className="font-display text-2xl"
            style={{ color: 'var(--text)' }}
          >
            {PLAN_NAMES[s.plan]} · {FOR_NAMES[s.forWhom]}
          </span>
          {statusBadge(s)}
        </div>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Delivering to {s.delivery.address} · {s.delivery.phone}
        </p>
      </Panel>

      {s.status === 'waitlist' && (
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          We&apos;ll email you when {PLAN_NAMES[s.plan]} opens.
        </p>
      )}

      {due && s.status !== 'cancelled' && (
        <Panel>
          <p
            className="text-xs tracking-[0.3em]"
            style={{ color: 'var(--gold)' }}
          >
            DUE
          </p>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <span className="text-sm" style={{ color: 'var(--text)' }}>
              {monthName(due.month)} box · {due.amount.toLocaleString()}₮
            </span>
            <Button size="sm" onClick={() => pay(due.id, refresh)}>
              PAY WITH QPAY
            </Button>
          </div>
          <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
            Pay by the 20th; boxes go out from the 5th.
          </p>
        </Panel>
      )}

      {s.boxes.length > 0 && (
        <section className="space-y-3">
          <p
            className="text-xs tracking-[0.4em]"
            style={{ color: 'var(--text-dim)' }}
          >
            YOUR BOXES
          </p>
          {s.boxes.map((b) => (
            <Panel key={b.id}>
              <div className="flex items-center justify-between">
                <span
                  className="font-display text-lg"
                  style={{ color: 'var(--text)' }}
                >
                  {monthName(b.month)}
                </span>
                <Badge
                  label={
                    b.status === 'confirmed' ? 'ON ITS WAY' : 'BEING PACKED'
                  }
                  variant={b.status === 'confirmed' ? 'success' : 'warning'}
                />
              </div>
              {/* The scents stay a surprise until the box is packed */}
              {b.status === 'confirmed' ? (
                <ul
                  className="text-sm space-y-1"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {b.items.map((i) => (
                    <li key={i.id}>
                      {i.listing?.title ?? '—'} · {i.sizeMl}ml{' '}
                      {TIER_NAMES[i.tier]}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm" style={{ color: 'var(--text-dim)' }}>
                  Two surprises on the way.
                </p>
              )}
            </Panel>
          ))}
        </section>
      )}

      {s.status !== 'cancelled' &&
        (confirming ? (
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              No more invoices will be sent. A box you&apos;ve already paid for
              still arrives.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirming(false)}
              >
                KEEP MY SUBSCRIPTION
              </Button>
              <Button
                variant="danger"
                size="sm"
                loading={cancel.isPending}
                onClick={() => cancel.mutate()}
              >
                YES, CANCEL
              </Button>
            </div>
          </div>
        ) : (
          <button
            className="text-xs tracking-widest"
            style={{ color: 'var(--text-dim)' }}
            onClick={() => setConfirming(true)}
          >
            Cancel subscription
          </button>
        ))}
    </div>
  );
};

export const SubscriptionPage = () => {
  const { data: subscription, isLoading } = useMySubscription();
  const { status, payment, error, payInvoice, cancelPayment, reset } =
    usePayment();
  const qc = useQueryClient();

  // After paying, close the QR shortly and show the updated subscription
  const pay: Pay = (invoiceId, onPaid) =>
    payInvoice(invoiceId, () => {
      onPaid();
      qc.invalidateQueries({ queryKey: ['subscription'] });
      setTimeout(reset, 2000);
    });

  // Someone on a waitlist can still start an open plan meanwhile
  const showSignUp =
    !subscription ||
    subscription.status === 'cancelled' ||
    subscription.status === 'waitlist';

  return (
    <Layout>
      <PaymentModal
        status={status}
        payment={payment}
        error={error}
        onCancel={cancelPayment}
      />
      <div className="mx-auto max-w-2xl px-6 py-16 space-y-10">
        {isLoading ? (
          <div
            className="shimmer h-40"
            style={{ background: 'var(--bg-card)' }}
          />
        ) : showSignUp ? (
          <>
            {subscription?.status === 'cancelled' && (
              <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                Your subscription is cancelled. Sign up again any time.
              </p>
            )}
            {subscription?.status === 'waitlist' && (
              <Panel>
                <p className="text-sm" style={{ color: 'var(--gold)' }}>
                  You&apos;re on the {PLAN_NAMES[subscription.plan]} waitlist.
                  We&apos;ll email you when it opens.
                </p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Want boxes in the meantime? Subscribe to an open plan below.
                </p>
              </Panel>
            )}
            <SignUp pay={pay} />
          </>
        ) : (
          <Overview subscription={subscription} pay={pay} />
        )}
      </div>
    </Layout>
  );
};
