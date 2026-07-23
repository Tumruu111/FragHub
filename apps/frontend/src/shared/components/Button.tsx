import type { FC, ButtonHTMLAttributes } from 'react';

type Variant = 'gold' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const styles: Record<Variant, React.CSSProperties> = {
  gold: {
    background: 'linear-gradient(135deg, #8a6f2e, #C9A84C, #E8C97A, #C9A84C)',
    color: '#0a0a0a',
    fontWeight: 600,
  },
  outline: {
    background: 'transparent',
    color: 'var(--gold)',
    border: '1px solid var(--border-gold)',
  },
  ghost: { background: 'transparent', color: 'var(--text-muted)' },
  danger: {
    background: 'transparent',
    color: '#f87171',
    border: '1px solid rgba(248,113,113,0.3)',
  },
};

const sizes: Record<Size, string> = {
  sm: 'px-4 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-xs',
  lg: 'px-8 py-3.5 text-sm',
};

export const Button: FC<ButtonProps> = ({
  variant = 'gold',
  size = 'md',
  loading,
  disabled,
  className = '',
  children,
  style,
  ...props
}) => (
  <button
    disabled={disabled || loading}
    className={`inline-flex items-center justify-center gap-2 tracking-widest transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${sizes[size]} ${className}`}
    style={{ ...styles[variant], ...style }}
    {...props}
  >
    {loading && (
      <span className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
    )}
    {children}
  </button>
);
