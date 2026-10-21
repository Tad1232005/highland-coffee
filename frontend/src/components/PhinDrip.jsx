/**
 * Khoảnh khắc mở đầu: giọt cà phê rơi qua phin xuống ly sữa đá.
 * Một vòng lặp duy nhất, tự dừng khi người dùng bật giảm chuyển động.
 */
export function PhinDrip() {
  return (
    <svg
      className="phin"
      viewBox="0 0 420 470"
      role="img"
      aria-label="Cà phê phin nhỏ giọt xuống một ly sữa đá"
    >
      <defs>
        <linearGradient id="phin-metal" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f4ece0" />
          <stop offset="42%" stopColor="#c9b8a6" />
          <stop offset="70%" stopColor="#8d7a6a" />
          <stop offset="100%" stopColor="#d8cabb" />
        </linearGradient>
        <linearGradient id="phin-coffee" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a2a19" />
          <stop offset="100%" stopColor="#2e1a0f" />
        </linearGradient>
        <radialGradient id="phin-glow" cx="50%" cy="46%" r="52%">
          <stop offset="0%" stopColor="#f0dfc0" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#f0dfc0" stopOpacity="0" />
        </radialGradient>
        <clipPath id="phin-glass-clip">
          <path d="M151 330 H269 L262 438 H158 Z" />
        </clipPath>
      </defs>

      <ellipse cx="210" cy="330" rx="190" ry="210" fill="url(#phin-glow)" />

      {/* Phin */}
      <g className="phin__filter">
        <circle cx="210" cy="92" r="9" fill="url(#phin-metal)" />
        <rect x="197" y="92" width="26" height="12" rx="6" fill="url(#phin-metal)" />
        <path
          d="M286 142 q46 6 40 42 q-3 18 -24 17"
          fill="none"
          stroke="url(#phin-metal)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path d="M134 126 H286 L224 250 H196 Z" fill="url(#phin-metal)" />
        <ellipse cx="210" cy="126" rx="76" ry="15" fill="url(#phin-metal)" />
        <ellipse cx="210" cy="126" rx="76" ry="15" fill="none" stroke="rgba(31,20,16,.25)" />
        <ellipse cx="210" cy="252" rx="19" ry="6" fill="url(#phin-metal)" />
      </g>

      {/* Giọt cà phê */}
      <circle className="phin__drop" cx="210" cy="268" r="5.5" fill="#f0dfc0" />

      {/* Ly sữa đá */}
      <g clipPath="url(#phin-glass-clip)">
        <rect x="150" y="392" width="120" height="48" fill="#f0dfc0" />
        <rect x="150" y="350" width="120" height="42" fill="url(#phin-coffee)" />
        <rect
          x="166"
          y="354"
          width="27"
          height="27"
          rx="6"
          fill="#ffffff"
          fillOpacity="0.2"
          transform="rotate(-14 179 367)"
        />
        <rect
          x="206"
          y="358"
          width="23"
          height="23"
          rx="6"
          fill="#ffffff"
          fillOpacity="0.16"
          transform="rotate(16 217 369)"
        />
      </g>
      <path
        d="M151 330 H269 L262 438 H158 Z"
        fill="none"
        stroke="rgba(247,240,230,0.55)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <ellipse className="phin__ripple" cx="210" cy="350" rx="16" ry="4.5" fill="none" stroke="#f0dfc0" strokeWidth="2" />

      {/* Mặt quầy */}
      <line x1="66" y1="444" x2="354" y2="444" stroke="rgba(240,223,192,0.22)" strokeWidth="2" />
    </svg>
  )
}
