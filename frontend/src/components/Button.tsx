import { ButtonHTMLAttributes, ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children?: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
}

const variants: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: 'var(--rind)',
    color: 'var(--ink)',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--pith)',
    border: '1px solid rgba(247, 242, 234, 0.25)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--rind-400)',
    border: 'none',
  },
  danger: {
    background: 'transparent',
    color: 'var(--danger)',
    border: '1px solid rgba(232, 112, 112, 0.35)',
  },
};

const sizes: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: '6px 12px',
    fontSize: '13px',
  },
  md: {
    padding: '10px 20px',
    fontSize: '14px',
  },
  lg: {
    padding: '14px 28px',
    fontSize: '16px',
  },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  loading,
  icon,
  iconRight,
  fullWidth,
  disabled,
  style,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.98 }}
      disabled={disabled || loading}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        borderRadius: '6px',
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background 150ms ease, border-color 150ms ease',
        width: fullWidth ? '100%' : 'auto',
        ...variants[variant],
        ...sizes[size],
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ display: 'flex', width: 16, height: 16 }}
        >
          <svg viewBox="0 0 20 20" width="16" height="16">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeLinecap="round" />
          </svg>
        </motion.span>
      ) : icon ? (
        <span style={{ display: 'flex' }}>{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span style={{ display: 'flex' }}>{iconRight}</span>
      )}
    </motion.button>
  );
}
