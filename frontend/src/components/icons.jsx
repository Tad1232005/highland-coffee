const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
}

export function IconCart(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h2l1.6 9.2a2 2 0 0 0 2 1.6h6.9a2 2 0 0 0 2-1.5L20 8H7" />
      <circle cx="10" cy="19" r="1.4" />
      <circle cx="17.5" cy="19" r="1.4" />
    </svg>
  )
}

export function IconUser(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="8.5" r="3.4" />
      <path d="M4.8 20a7.4 7.4 0 0 1 14.4 0" />
    </svg>
  )
}

export function IconSearch(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="11" cy="11" r="6.4" />
      <path d="m16 16 4 4" />
    </svg>
  )
}

export function IconPlus(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function IconMinus(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h14" />
    </svg>
  )
}

export function IconTrash(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
      <path d="M6.5 7 7.4 19a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4L17.5 7" />
    </svg>
  )
}

export function IconCheck(props) {
  return (
    <svg {...base} {...props}>
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  )
}

export function IconCup(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 9h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" />
      <path d="M16 11h1.8a2.2 2.2 0 0 1 0 4.4H16" />
      <path d="M4 21h13" />
    </svg>
  )
}

export function IconReceipt(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3h12v18l-3-1.6-3 1.6-3-1.6L6 21V3Z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export function IconGrid(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5h6v6H4zM14 5h6v6h-6zM4 14h6v5H4zM14 14h6v5h-6z" />
    </svg>
  )
}

export function IconHome(props) {
  return (
    <svg {...base} {...props}>
      <path d="m3.5 10 8.5-7 8.5 7v9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2v-9Z" />
      <path d="M9 21v-7h6v7" />
    </svg>
  )
}

export function IconChart(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 20h16" />
      <path d="M6 16v-4M12 16V5M18 16V9" />
      <path d="M4 4v16" />
    </svg>
  )
}

export function IconChevronDown(props) {
  return (
    <svg {...base} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

export function IconClock(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  )
}

export function IconPhone(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 3.5h3l1.5 4-2 1.4a11 11 0 0 0 5.6 5.6l1.4-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.7 2 2 0 0 1 6 3.5Z" />
    </svg>
  )
}

export function IconPin(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21Z" />
      <circle cx="12" cy="10.5" r="2.4" />
    </svg>
  )
}

export function IconLogout(props) {
  return (
    <svg {...base} {...props}>
      <path d="M14 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h7" />
      <path d="M17 12H10M17 12l-2.5-2.5M17 12l-2.5 2.5" />
    </svg>
  )
}

export function IconMenu(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  )
}

export function IconPanelLeft(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.4" y="4.4" width="17.2" height="15.2" rx="2.2" />
      <path d="M9.8 4.4v15.2" />
    </svg>
  )
}

export function IconStore(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.4 9.5 6 4.8a1.6 1.6 0 0 1 1.5-1.1h9a1.6 1.6 0 0 1 1.5 1.1l1.6 4.7" />
      <path d="M4.4 9.5h15.2" />
      <path d="M5.6 9.5V19a1.6 1.6 0 0 0 1.6 1.6h9.6A1.6 1.6 0 0 0 18.4 19V9.5" />
      <path d="M9.6 20.6v-5.2h4.8v5.2" />
    </svg>
  )
}

export function IconX(props) {
  return (
    <svg {...base} {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

export function IconAlert(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
      <path d="M12 10v4.2M12 17.2v.1" />
    </svg>
  )
}

export function IconInfo(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 8.2v.1" />
    </svg>
  )
}

export function IconCheckCircle(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.4 12.2 2.4 2.4 4.8-5" />
    </svg>
  )
}

export function IconArrowRight(props) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5" />
    </svg>
  )
}

export function IconArrowLeft(props) {
  return (
    <svg {...base} {...props}>
      <path d="M19.5 12h-14M11 6.5 5.5 12l5.5 5.5" />
    </svg>
  )
}

export function IconSpark(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5c.6 3.6 1.9 5 5.5 5.5-3.6.6-4.9 1.9-5.5 5.5-.6-3.6-1.9-4.9-5.5-5.5 3.6-.5 4.9-1.9 5.5-5.5Z" />
      <path d="M18.5 15.5c.3 1.8 1 2.5 2.8 2.8-1.8.3-2.5 1-2.8 2.8-.3-1.8-1-2.5-2.8-2.8 1.8-.3 2.5-1 2.8-2.8Z" />
    </svg>
  )
}
