// Icon set for Pulp — 20x20 stroke icons, consistent weight
// Drawn specifically for financial ops / agent economy context

const stroke = 'currentColor';
const sw = 1.6;

const IconSet = {
  // Core: agent, ledger, wallet, flow, clock, lock
  agent: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="7" r="3" stroke={stroke} strokeWidth={sw}/>
      <path d="M4 17 C 4 13, 7 11, 10 11 C 13 11, 16 13, 16 17" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      <circle cx="10" cy="7" r="0.8" fill={stroke}/>
    </svg>
  ),
  ledger: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="3" y="4" width="14" height="13" rx="1.5" stroke={stroke} strokeWidth={sw}/>
      <line x1="6" y1="8" x2="14" y2="8" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="6" y1="11" x2="14" y2="11" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="6" y1="14" x2="11" y2="14" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="2.5" y="5" width="15" height="11" rx="2" stroke={stroke} strokeWidth={sw}/>
      <path d="M2.5 8 H17.5" stroke={stroke} strokeWidth={sw}/>
      <circle cx="13.5" cy="12" r="1" fill={stroke}/>
    </svg>
  ),
  flow: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 7 H13 M13 7 L10 4 M13 7 L10 10" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 13 H7 M7 13 L10 10 M7 13 L10 16" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  clock: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={stroke} strokeWidth={sw}/>
      <path d="M10 6 V10 L13 12" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 20 20" fill="none">
      <rect x="4" y="9" width="12" height="8" rx="1.5" stroke={stroke} strokeWidth={sw}/>
      <path d="M7 9 V6.5 A3 3 0 0 1 13 6.5 V9" stroke={stroke} strokeWidth={sw}/>
      <circle cx="10" cy="13" r="1" fill={stroke}/>
    </svg>
  ),
  key: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="6" cy="10" r="3" stroke={stroke} strokeWidth={sw}/>
      <path d="M9 10 H17 M15 10 V13 M13 10 V12" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  ),
  zap: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M11 2 L4 11 H9 L8 18 L15 9 H10 L11 2 Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" fill="none"/>
    </svg>
  ),
  cart: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M2 4 H4 L5 14 H15 L17 7 H5" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="7" cy="17" r="1.2" stroke={stroke} strokeWidth={sw}/>
      <circle cx="13" cy="17" r="1.2" stroke={stroke} strokeWidth={sw}/>
    </svg>
  ),
  api: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M6 5 L2 10 L6 15" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14 5 L18 10 L14 15" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="11" y1="4" x2="9" y2="16" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={stroke} strokeWidth={sw}/>
      <path d="M7 10 L9 12 L13 8" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M10 3 L18 16 H2 Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <line x1="10" y1="8" x2="10" y2="12" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      <circle cx="10" cy="14" r="0.7" fill={stroke}/>
    </svg>
  ),
  orange: (
    <svg viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="11" r="7" stroke={stroke} strokeWidth={sw}/>
      <line x1="10" y1="11" x2="10" y2="4" stroke={stroke} strokeWidth={sw}/>
      <path d="M10 4 C 13 3, 14 5, 13 6" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  ),
  slice: (
    <svg viewBox="0 0 20 20" fill="none">
      <path d="M3 17 L3 3 A14 14 0 0 1 17 17 Z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <line x1="3" y1="17" x2="11" y2="5" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="3" y1="17" x2="15" y2="11" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
    </svg>
  ),
};

Object.assign(window, { IconSet });
