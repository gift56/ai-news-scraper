type IconProps = {
  className?: string;
};

const iconDefaults = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function MenuIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function BookmarkIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M6 4h12v16l-6-4-6 4V4z" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6M12 7h.01" />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
      <path d="M12 3v12M8 7l4-4 4 4" />
    </svg>
  );
}

export function ExternalLinkIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M14 5h5v5M10 14 19 5M19 14v5H5V5h5" />
    </svg>
  );
}

export function BarChartIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M4 20V10M10 20V4M16 20v-6M22 20H2" />
    </svg>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}
