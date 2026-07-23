import type { FC, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: FC<InputProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="flex flex-col gap-1.5">
    {label && (
      <label
        className="text-xs tracking-[0.2em]"
        style={{ color: 'var(--text-muted)' }}
      >
        {label}
      </label>
    )}
    <input
      className={`w-full px-4 py-3 text-sm outline-none transition-colors ${className}`}
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${error ? '#f87171' : 'var(--border)'}`,
        color: 'var(--text)',
      }}
      onFocus={(e) =>
        (e.currentTarget.style.borderColor = error
          ? '#f87171'
          : 'var(--gold-dim)')
      }
      onBlur={(e) =>
        (e.currentTarget.style.borderColor = error
          ? '#f87171'
          : 'var(--border)')
      }
      {...props}
    />
    {error && (
      <p className="text-xs" style={{ color: '#f87171' }}>
        {error}
      </p>
    )}
  </div>
);
