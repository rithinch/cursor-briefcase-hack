// Icon set for Pulp — 20x20 stroke icons, consistent weight
// Drawn specifically for financial ops / agent economy context

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const defaultProps: IconProps = { size: 20 };

export const Icons = {
  agent: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M4 17 C 4 13, 7 11, 10 11 C 13 11, 16 13, 16 17" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <circle cx="10" cy="7" r="0.8" fill="currentColor"/>
    </svg>
  ),
  ledger: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" strokeWidth={1.6}/>
      <line x1="6" y1="8" x2="14" y2="8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="6" y1="11" x2="14" y2="11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="6" y1="14" x2="11" y2="14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  wallet: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="2.5" y="5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M2.5 8 H17.5" stroke="currentColor" strokeWidth={1.6}/>
      <circle cx="13.5" cy="12" r="1" fill="currentColor"/>
    </svg>
  ),
  flow: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M3 7 H13 M13 7 L10 4 M13 7 L10 10" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 13 H7 M7 13 L10 10 M7 13 L10 16" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M10 6 V10 L13 12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  lock: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M7 9 V6.5 A3 3 0 0 1 13 6.5 V9" stroke="currentColor" strokeWidth={1.6}/>
      <circle cx="10" cy="13" r="1" fill="currentColor"/>
    </svg>
  ),
  key: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="6" cy="10" r="3" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M9 10 H17 M15 10 V13 M13 10 V12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  zap: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M11 2 L4 11 H9 L8 18 L15 9 H10 L11 2 Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  api: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M6 5 L2 10 L6 15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 5 L18 10 L14 15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="11" y1="4" x2="9" y2="16" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  check: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M7 10 L9 12 L13 8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  checkSmall: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M5 10 L8 13 L15 6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  alert: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M10 3 L18 16 H2 Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"/>
      <line x1="10" y1="8" x2="10" y2="12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <circle cx="10" cy="14" r="0.7" fill="currentColor"/>
    </svg>
  ),
  slice: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M3 17 L3 3 A14 14 0 0 1 17 17 Z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"/>
      <line x1="3" y1="17" x2="11" y2="5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="3" y1="17" x2="15" y2="11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  plus: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <line x1="10" y1="4" x2="10" y2="16" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="4" y1="10" x2="16" y2="10" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  x: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <line x1="5" y1="5" x2="15" y2="15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="15" y1="5" x2="5" y2="15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  arrowRight: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M4 10 H16 M16 10 L12 6 M16 10 L12 14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowLeft: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M16 10 H4 M4 10 L8 6 M4 10 L8 14" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronDown: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M5 7 L10 12 L15 7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M7 5 L12 10 L7 15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  settings: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.66 4.34l-1.42 1.42M5.76 14.24l-1.42 1.42M15.66 15.66l-1.42-1.42M5.76 5.76l-1.42-1.42" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  mail: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M2 6 L10 11 L18 6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  copy: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="6" y="6" width="11" height="11" rx="1.5" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M14 6V4.5A1.5 1.5 0 0012.5 3h-9A1.5 1.5 0 002 4.5v9A1.5 1.5 0 003.5 15H6" stroke="currentColor" strokeWidth={1.6}/>
    </svg>
  ),
  eye: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <ellipse cx="10" cy="10" rx="8" ry="5" stroke="currentColor" strokeWidth={1.6}/>
      <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth={1.6}/>
    </svg>
  ),
  eyeOff: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M3 3l14 14M8 10.5a2.5 2.5 0 004-2.5M2 10s3-5 8-5c1.2 0 2.3.2 3.3.6M18 10s-1.5 2.5-4 4" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  refresh: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M3 10a7 7 0 0113.07-3.5M17 10a7 7 0 01-13.07 3.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <path d="M16.07 2v4.5h-4.5M3.93 18v-4.5h4.5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  trash: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M4 6h12M6 6v10a2 2 0 002 2h4a2 2 0 002-2V6M8 6V4a1 1 0 011-1h2a1 1 0 011 1v2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  link: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M8 12l4-4M6.5 9.5l-1 1a3 3 0 004.24 4.24l1-1M13.5 10.5l1-1a3 3 0 00-4.24-4.24l-1 1" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  home: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M3 8l7-5 7 5v9a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"/>
      <path d="M7 18v-6h6v6" stroke="currentColor" strokeWidth={1.6}/>
    </svg>
  ),
  grid: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="3" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth={1.6}/>
      <rect x="12" y="3" width="5" height="5" rx="1" stroke="currentColor" strokeWidth={1.6}/>
      <rect x="3" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth={1.6}/>
      <rect x="12" y="12" width="5" height="5" rx="1" stroke="currentColor" strokeWidth={1.6}/>
    </svg>
  ),
  list: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <line x1="6" y1="5" x2="17" y2="5" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="6" y1="10" x2="17" y2="10" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="6" y1="15" x2="17" y2="15" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <circle cx="3" cy="5" r="1" fill="currentColor"/>
      <circle cx="3" cy="10" r="1" fill="currentColor"/>
      <circle cx="3" cy="15" r="1" fill="currentColor"/>
    </svg>
  ),
  logout: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3M14 14l4-4-4-4M18 10H7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  sun: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M10 2v2M10 16v2M18 10h-2M4 10H2M15.66 4.34l-1.42 1.42M5.76 14.24l-1.42 1.42M15.66 15.66l-1.42-1.42M5.76 5.76l-1.42-1.42" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  moon: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M17 10.5A7 7 0 019.5 3a7 7 0 107.5 7.5z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"/>
    </svg>
  ),
  search: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M12.5 12.5L17 17" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  xero: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M5 5l10 10M15 5l-10 10" stroke="currentColor" strokeWidth={2} strokeLinecap="round"/>
    </svg>
  ),
  quickbooks: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M8 13V7l4 3-4 3z" fill="currentColor"/>
    </svg>
  ),
  yapily: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M3 5l7 5-7 5V5zM10 5l7 5-7 5V5z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"/>
    </svg>
  ),
  wise: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M2 10l6-6 2 4 6-4 2 6-8 6-8-6z" stroke="currentColor" strokeWidth={1.6} strokeLinejoin="round"/>
    </svg>
  ),
  revolut: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M7 13V7h4a2 2 0 110 4H7l4 2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  invoice: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="4" y="2" width="12" height="16" rx="1.5" stroke="currentColor" strokeWidth={1.6}/>
      <line x1="7" y1="6" x2="13" y2="6" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="7" y1="9" x2="13" y2="9" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="7" y1="12" x2="10" y2="12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  payment: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <rect x="2" y="5" width="16" height="11" rx="2" stroke="currentColor" strokeWidth={1.6}/>
      <line x1="2" y1="9" x2="18" y2="9" stroke="currentColor" strokeWidth={1.6}/>
      <line x1="6" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
    </svg>
  ),
  approval: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <path d="M10 2v3M5 7H2M18 7h-3M6 4l2 2M14 4l-2 2" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <circle cx="10" cy="12" r="5" stroke="currentColor" strokeWidth={1.6}/>
      <path d="M8 12l1.5 1.5 3-3" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  rail: ({ size = 20, ...props }: IconProps) => (
    <svg viewBox="0 0 20 20" fill="none" width={size} height={size} {...props}>
      <line x1="3" y1="8" x2="17" y2="8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1="3" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
      <circle cx="6" cy="8" r="1.5" fill="currentColor"/>
      <circle cx="14" cy="12" r="1.5" fill="currentColor"/>
    </svg>
  ),
};

export default Icons;
