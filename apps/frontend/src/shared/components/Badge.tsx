import { FC } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'gold';

const variants: Record<BadgeVariant, React.CSSProperties> = {
  default: { background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' },
  success: { background: 'rgba(16,185,129,0.12)', color: '#6ee7b7' },
  warning: { background: 'rgba(245,158,11,0.12)', color: '#fcd34d' },
  danger: { background: 'rgba(248,113,113,0.12)', color: '#fca5a5' },
  gold: { background: 'rgba(201,168,76,0.12)', color: 'var(--gold)' },
};

export const Badge: FC<{ label: string; variant?: BadgeVariant; className?: string }> = ({
  label, variant = 'default', className = ''
}) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 text-xs tracking-widest ${className}`}
    style={variants[variant]}
  >
    {label}
  </span>
);
