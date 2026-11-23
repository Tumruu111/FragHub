import type { FormEvent } from 'react';
import { Input } from '../../../shared/components/Input';
import type { Delivery } from '../../../types/order';

// The last details used, so returning customers don't type them again. Kept
// only in this browser.
const STORAGE_KEY = 'veritas.delivery';

export const emptyDelivery: Delivery = { phone: '', address: '', note: '' };

export const loadSavedDelivery = (): Delivery => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    return saved ? { ...emptyDelivery, ...saved } : emptyDelivery;
  } catch {
    return emptyDelivery;
  }
};

export const saveDelivery = (d: Delivery) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
  } catch {
    // Private mode or storage full; they'll just type it next time
  }
};

// The same rules the API applies, so most mistakes show before paying
export const deliveryErrors = (d: Delivery): Partial<Delivery> => {
  const errors: Partial<Delivery> = {};
  const digits = d.phone.replace(/[\s\-()]/g, '').replace(/^\+?976/, '');
  if (!/^\d{8}$/.test(digits)) errors.phone = 'Enter an 8-digit phone number';
  if (d.address.trim().length < 10)
    errors.address = 'Enter the full delivery address';
  return errors;
};

interface Props {
  id: string;
  value: Delivery;
  errors: Partial<Delivery>;
  onChange: (d: Delivery) => void;
  onSubmit: () => void;
}

export const DeliveryForm = ({
  id,
  value,
  errors,
  onChange,
  onSubmit,
}: Props) => {
  const set = (field: keyof Delivery) => (v: string) =>
    onChange({ ...value, [field]: v });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form id={id} onSubmit={submit} className="flex flex-col gap-5 pt-4">
      <p className="drawer-empty-text" style={{ letterSpacing: '0.3em' }}>
        DELIVERY DETAILS
      </p>
      <Input
        label="PHONE"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder="9911 2233"
        value={value.phone}
        error={errors.phone}
        onChange={(e) => set('phone')(e.target.value)}
      />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`${id}-address`}
          className="text-xs tracking-[0.2em]"
          style={{ color: 'var(--text-muted)' }}
        >
          ADDRESS
        </label>
        <textarea
          id={`${id}-address`}
          rows={3}
          autoComplete="street-address"
          placeholder="District, khoroo, building, entrance, apartment"
          value={value.address}
          onChange={(e) => set('address')(e.target.value)}
          className="w-full px-4 py-3 text-sm outline-none resize-none"
          style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${errors.address ? '#f87171' : 'var(--border)'}`,
            color: 'var(--text)',
          }}
        />
        {errors.address && (
          <p className="text-xs" style={{ color: '#f87171' }}>
            {errors.address}
          </p>
        )}
      </div>
      <Input
        label="NOTE (OPTIONAL)"
        placeholder="Door code, best time to call…"
        maxLength={300}
        value={value.note ?? ''}
        onChange={(e) => set('note')(e.target.value)}
      />
    </form>
  );
};
