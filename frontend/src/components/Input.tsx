import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  mono?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, mono, style, ...props }, ref) => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {label && (
          <label style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '11px',
            fontWeight: 500,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--muted)',
          }}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            background: 'rgba(247, 242, 234, 0.04)',
            border: error ? '1.5px solid var(--danger)' : '1px solid rgba(247, 242, 234, 0.15)',
            borderRadius: '5px',
            padding: '10px 14px',
            fontSize: '14px',
            fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
            color: 'var(--pith)',
            outline: 'none',
            transition: 'border-color 150ms ease, box-shadow 150ms ease',
            width: '100%',
            ...style,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--rind)';
            e.target.style.boxShadow = '0 0 0 1px var(--rind)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = error ? 'var(--danger)' : 'rgba(247, 242, 234, 0.15)';
            e.target.style.boxShadow = 'none';
          }}
          {...props}
        />
        {(error || hint) && (
          <span style={{
            fontSize: '12px',
            color: error ? 'var(--danger)' : 'var(--muted)',
          }}>
            {error || hint}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
