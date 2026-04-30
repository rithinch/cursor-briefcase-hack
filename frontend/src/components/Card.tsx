import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  padding?: 'none' | 'dense' | 'default';
  hover?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export default function Card({ children, padding = 'default', hover, onClick, style }: CardProps) {
  const paddingValues = {
    none: 0,
    dense: 24,
    default: 32,
  };

  const Wrapper = hover ? motion.div : 'div';
  const motionProps = hover ? {
    whileHover: { y: -2, borderColor: 'rgba(247, 242, 234, 0.15)' },
    transition: { duration: 0.15 },
  } : {};

  return (
    <Wrapper
      onClick={onClick}
      style={{
        background: 'var(--ink-700)',
        border: '1px solid var(--hair)',
        borderRadius: '8px',
        padding: paddingValues[padding],
        cursor: onClick ? 'pointer' : 'default',
        ...style,
      }}
      {...motionProps}
    >
      {children}
    </Wrapper>
  );
}
