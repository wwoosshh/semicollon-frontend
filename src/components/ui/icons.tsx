// Custom monoline icon set — editorial / Swiss, hand-drawn 24×24 grid.
// Uniform 1.5 stroke, round caps/joins, no fill. currentColor so they inherit
// text color (and the accent on hover/active). No external icon library.

import { cn } from "@/lib/utils";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  /** Optical size in px (sets both width & height). Default 24. */
  size?: number;
}

function Svg({ size = 24, className, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("shrink-0", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

// ── Navigation / sections ───────────────────────────────────────────────────

export function IconHome(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  );
}

/** Stacked layers — 활동공간 / spaces. */
export function IconSpaces(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 3.5 20.5 8 12 12.5 3.5 8 12 3.5Z" />
      <path d="M3.5 12 12 16.5 20.5 12" />
      <path d="M3.5 16 12 20.5 20.5 16" />
    </Svg>
  );
}

export function IconCalendar(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="0.5" />
      <path d="M4 9.5h16" />
      <path d="M8 3.5v4M16 3.5v4" />
      <path d="M8 13h2M14 13h2M8 16.5h2M14 16.5h2" />
    </Svg>
  );
}

/** Two people — 멤버. */
export function IconMembers(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 20c0-3.3 2.5-5.5 5.5-5.5s5.5 2.2 5.5 5.5" />
      <path d="M16 5.2a3 3 0 0 1 0 5.6" />
      <path d="M17 14.7c2.2.6 3.5 2.6 3.5 5.3" />
    </Svg>
  );
}

/** Megaphone — 소식 / news. */
export function IconNews(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 10v4l9 4V6l-9 4Z" />
      <path d="M13 7.5 19.5 5v14L13 16.5" />
      <path d="M6.5 14.5 8 20H5l-1.2-4.5" />
    </Svg>
  );
}

/** Single person. */
export function IconMember(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20c0-3.6 3-6 7-6s7 2.4 7 6" />
    </Svg>
  );
}

// ── Communication ───────────────────────────────────────────────────────────

export function IconChat(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 5.5h16v10H9l-4 3.5v-3.5H4v-10Z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </Svg>
  );
}

export function IconMic(props: IconProps) {
  return (
    <Svg {...props}>
      <rect x="9" y="3.5" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
      <path d="M12 18v2.5M9 20.5h6" />
    </Svg>
  );
}

export function IconHash(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M9 4 7 20M17 4l-2 16" />
      <path d="M4.5 9h15M3.5 15h15" />
    </Svg>
  );
}

// ── Arrows / markers ────────────────────────────────────────────────────────

export function IconArrowRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M4 12h15" />
      <path d="M13 6l6 6-6 6" />
    </Svg>
  );
}

export function IconArrowUpRight(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M7 17 17 7" />
      <path d="M8.5 7H17v8.5" />
    </Svg>
  );
}

export function IconDot(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none" />
    </Svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </Svg>
  );
}

export function IconPin(props: IconProps) {
  return (
    <Svg {...props}>
      <path d="M12 21c4-4 6.5-7 6.5-10a6.5 6.5 0 0 0-13 0c0 3 2.5 6 6.5 10Z" />
      <circle cx="12" cy="11" r="2.3" />
    </Svg>
  );
}
