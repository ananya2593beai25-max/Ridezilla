// Inline SVG icons. They are decorative, so give the parent button or link a text label.

const paths = {
  pin: (
    <>
      <path d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  dot: <circle cx="12" cy="12" r="5" />,
  swap: <path d="M7 4v14M7 18l-3-3M7 18l3-3M17 20V6M17 6l-3 3M17 6l3 3" />,
  locate: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <circle cx="12" cy="12" r="7.5" />
    </>
  ),
  leaf: (
    <>
      <path d="M5 19c0-8 5-13 15-13 0 10-5 14-12 14-1 0-2.2-.3-3-1z" />
      <path d="M5 19c3-5 6-8 10-10" />
    </>
  ),
  home: <path d="M3 11l9-8 9 8M5.5 9.5V20h13V9.5" />,
  car: (
    <>
      <path d="M4 16l1.5-5a2.5 2.5 0 012.4-1.8h8.2a2.5 2.5 0 012.4 1.8L20 16v3H4z" />
      <circle cx="7.5" cy="19" r="1.5" />
      <circle cx="16.5" cy="19" r="1.5" />
    </>
  ),
  chart: <path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6" />,
  list: <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M4 7l8 6 8-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  logout: <path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  chat: <path d="M4 5h16v11H9l-5 4V5z" />,
  users: (
    <>
      <path d="M16 20v-1.5a4 4 0 00-4-4H7a4 4 0 00-4 4V20" />
      <circle cx="9.5" cy="8" r="3.5" />
      <path d="M21 20v-1.5a4 4 0 00-3-3.9M15.5 4.6a3.5 3.5 0 010 6.8" />
    </>
  ),
  bolt: <path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" />,
  inbox: <path d="M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  send: <path d="M4 12l16-8-6 16-3-7-7-1z" />,
  refresh: <path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />,
  tag: (
    <>
      <path d="M3 12V4h8l9 9-8 8-9-9z" />
      <circle cx="7.5" cy="8.5" r="1.2" />
    </>
  ),
};

export default function Icon({ name, size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  );
}

// Larger vehicle drawings for cards.
const vehiclePaths = {
  bike: (
    <>
      <circle cx="11" cy="33" r="6.5" />
      <circle cx="37" cy="33" r="6.5" />
      <path d="M11 33l6-12h11l9 12M17 21l7 12M28 21l-2.5-6H21" />
      <path d="M33 8l-3.5 6h5L31 20" />
    </>
  ),
  rickshaw: (
    <>
      <path d="M8 32V19c0-2.8 2-5 5-5h17c2.4 0 4.4 1.4 5.3 3.6L41 27v5" />
      <path d="M8 24h24M24 14v10" />
      <circle cx="14" cy="34" r="4.2" />
      <circle cx="36" cy="34" r="4.2" />
      <path d="M18.2 34h13.6" />
    </>
  ),
  car: (
    <>
      <path d="M6 31l3-9.5c.7-2 2.5-3.5 4.7-3.5h20.6c2.2 0 4 1.5 4.7 3.5L42 31v5H6z" />
      <path d="M12 22h24" />
      <circle cx="14" cy="36" r="3.6" fill="var(--surface)" />
      <circle cx="34" cy="36" r="3.6" fill="var(--surface)" />
      <path d="M24 24.5l-2.5 4h5L24 33" />
    </>
  ),
};

export function VehicleIcon({ type, size = 44 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {vehiclePaths[type] || vehiclePaths.car}
    </svg>
  );
}

export function BrandMark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <rect width="32" height="32" rx="9" fill="#3DDC97" />
      <path d="M8.5 22c0-6.5 4.2-10.5 14-10.5 0 8.5-4.2 12.5-10.6 12.5-1.2 0-2.3-.3-3.4-2z" fill="#04140D" />
      <path d="M9.5 24c3-4.5 6.2-7.5 10.5-9.5" stroke="#3DDC97" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}
