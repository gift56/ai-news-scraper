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

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function LocationIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <path d="M12 21s6-5.5 6-11a6 6 0 0 0-12 0c0 5.5 6 11 6 11z" />
      <circle cx="12" cy="10" r="2.25" />
    </svg>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M4.5 4h4.3l4.4 6.2L17.8 4H20l-6.3 8.8L20.5 20h-4.3l-4.8-6.8L6.3 20H4l6.9-9.8L4.5 4z" />
    </svg>
  );
}

export function LinkedInIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 8.5H3.9V20h2.6V8.5zM5.2 3.5c-.9 0-1.7.7-1.7 1.7 0 .9.7 1.7 1.7 1.7S6.9 6.1 6.9 5.2c0-1-.7-1.7-1.7-1.7zM20 20h-2.6v-5.7c0-1.4 0-3.1-1.9-3.1s-2.2 1.5-2.2 3v5.8H10.7V8.5h2.5v1.6h.1c.4-.8 1.5-1.7 3-1.7 3.2 0 3.8 2.1 3.8 4.8V20z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg {...iconDefaults} className={className} aria-hidden="true">
      <rect x="4.5" y="4.5" width="15" height="15" rx="4" />
      <circle cx="12" cy="12" r="3.2" />
      <circle cx="16.9" cy="7.1" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YouTubeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M21.6 7.3c-.2-1-1-1.8-2-2-1.8-.4-7.6-.4-7.6-.4s-5.8 0-7.6.4c-1 .2-1.8 1-2 2C2 9.1 2 12 2 12s0 2.9.4 4.7c.2 1 1 1.8 2 2 1.8.4 7.6.4 7.6.4s5.8 0 7.6-.4c1-.2 1.8-1 2-2 .4-1.8.4-4.7.4-4.7s0-2.9-.4-4.7zM10 15.2V8.8l5.7 3.2L10 15.2z" />
    </svg>
  );
}
