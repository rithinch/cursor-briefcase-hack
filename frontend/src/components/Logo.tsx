interface LogoProps {
  size?: number;
  showWordmark?: boolean;
  variant?: 'dark' | 'light';
}

// Citrus Slice mark based on DESIGN.md specs
export function PulpMark({ size = 40, variant = 'dark' }: { size?: number; variant?: 'dark' | 'light' }) {
  const rind = '#FF7A1A';
  const flesh = '#FFB070';
  
  return (
    <svg viewBox="0 0 40 40" width={size} height={size}>
      {/* Outer fill - quarter circle */}
      <path 
        d="M4 36 L4 4 A32 32 0 0 1 36 36 Z" 
        fill={rind}
      />
      {/* Inner inset - flesh */}
      <path 
        d="M6 34 L6 6 A28 28 0 0 1 34 34 Z" 
        fill={flesh}
      />
      {/* Radiating lines from corner at (4, 36) */}
      <line x1="4" y1="36" x2="4" y2="8" stroke={rind} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="36" x2="10" y2="9" stroke={rind} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="36" x2="22" y2="14" stroke={rind} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="36" x2="30" y2="22" stroke={rind} strokeWidth="1.2" strokeLinecap="round"/>
      <line x1="4" y1="36" x2="32" y2="36" stroke={rind} strokeWidth="1.2" strokeLinecap="round"/>
      {/* Pulp dots */}
      <circle cx="11" cy="24" r="1.2" fill={rind}/>
      <circle cx="16" cy="15" r="1.0" fill={rind}/>
      <circle cx="22" cy="22" r="1.2" fill={rind}/>
      <circle cx="27" cy="30" r="1.0" fill={rind}/>
    </svg>
  );
}

export function PulpWordmark({ size = 40, variant = 'dark' }: { size?: number; variant?: 'dark' | 'light' }) {
  const color = variant === 'dark' ? '#F7F2EA' : '#0B0B0F';
  const fontSize = size * 0.64;
  
  return (
    <span style={{
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontWeight: 700,
      fontSize: `${fontSize}px`,
      letterSpacing: '-0.03em',
      color,
    }}>
      pulp
    </span>
  );
}

export default function Logo({ size = 40, showWordmark = true, variant = 'dark' }: LogoProps) {
  const gap = size * 0.3;
  
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: `${gap}px` }}>
      <PulpMark size={size} variant={variant} />
      {showWordmark && <PulpWordmark size={size} variant={variant} />}
    </div>
  );
}
