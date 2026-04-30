import { ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warn' | 'danger' | 'info' | 'rind';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  pill?: boolean;
  size?: 'sm' | 'md';
}

const variants: Record<BadgeVariant, { bg: string; border: string; text: string }> = {
  default: {
    bg: 'rgba(247, 242, 234, 0.08)',
    border: 'rgba(247, 242, 234, 0.15)',
    text: 'var(--pith)',
  },
  success: {
    bg: 'rgba(79, 199, 127, 0.15)',
    border: 'rgba(79, 199, 127, 0.30)',
    text: '#4FC77F',
  },
  warn: {
    bg: 'rgba(232, 163, 10, 0.15)',
    border: 'rgba(232, 163, 10, 0.30)',
    text: '#E8A30A',
  },
  danger: {
    bg: 'rgba(232, 112, 112, 0.15)',
    border: 'rgba(232, 112, 112, 0.30)',
    text: '#E87070',
  },
  info: {
    bg: 'rgba(59, 110, 232, 0.15)',
    border: 'rgba(59, 110, 232, 0.30)',
    text: '#3B6EE8',
  },
  rind: {
    bg: 'rgba(255, 122, 26, 0.15)',
    border: 'rgba(255, 122, 26, 0.30)',
    text: 'var(--rind)',
  },
};

export default function Badge({ variant = 'default', children, pill = true, size = 'sm' }: BadgeProps) {
  const colors = variants[variant];
  
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: size === 'sm' ? '3px 8px' : '4px 10px',
      borderRadius: pill ? '999px' : '4px',
      background: colors.bg,
      border: `1px solid ${colors.border}`,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: size === 'sm' ? '10px' : '11px',
      fontWeight: 500,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      color: colors.text,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  );
}

// Rail-specific badge with rectangular shape
export function RailBadge({ rail }: { rail: string }) {
  const railColors: Record<string, { bg: string; text: string }> = {
    mock: { bg: 'rgba(147, 112, 219, 0.2)', text: '#9370DB' },
    ach: { bg: 'rgba(59, 110, 232, 0.2)', text: '#3B6EE8' },
    wire: { bg: 'rgba(79, 199, 127, 0.2)', text: '#4FC77F' },
    rtp: { bg: 'rgba(255, 122, 26, 0.2)', text: 'var(--rind)' },
    card: { bg: 'rgba(232, 163, 10, 0.2)', text: '#E8A30A' },
    intl: { bg: 'rgba(147, 112, 219, 0.2)', text: '#9370DB' },
  };

  const colors = railColors[rail.toLowerCase()] || railColors.mock;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 6px',
      borderRadius: '4px',
      background: colors.bg,
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: '10px',
      fontWeight: 500,
      letterSpacing: '0.08em',
      textTransform: 'lowercase',
      color: colors.text,
    }}>
      {rail}
    </span>
  );
}
