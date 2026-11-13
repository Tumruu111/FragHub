import { Minus, Plus } from 'lucide-react';
import type { CSSProperties } from 'react';

interface QuantityStepperProps {
  value: number;
  max: number;
  min?: number;
  onChange: (value: number) => void;
  size?: 'sm' | 'md';
}

export const QuantityStepper = ({
  value,
  max,
  min = 1,
  onChange,
  size = 'md',
}: QuantityStepperProps) => {
  const box = size === 'sm' ? '1.75rem' : '2.5rem';
  const button = (disabled: boolean): CSSProperties => ({
    width: box,
    height: box,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    color: disabled ? 'var(--border)' : 'var(--text-muted)',
    cursor: disabled ? 'default' : 'pointer',
  });

  return (
    <div
      role="group"
      aria-label="Quantity"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        alignSelf: 'flex-start',
        border: '1px solid var(--border)',
      }}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        style={button(value <= min)}
      >
        <Minus size={size === 'sm' ? 11 : 13} />
      </button>
      <span
        aria-live="polite"
        style={{
          minWidth: box,
          textAlign: 'center',
          fontSize: size === 'sm' ? '0.7rem' : '0.85rem',
          color: 'var(--text)',
        }}
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        style={button(value >= max)}
      >
        <Plus size={size === 'sm' ? 11 : 13} />
      </button>
    </div>
  );
};
