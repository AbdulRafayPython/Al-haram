import type { ReactNode } from "react";

/**
 * A small, self-contained SVG icon set used by the Umrah package card.
 * All icons share one 24×24 grid, a 1.6 stroke, and `currentColor`, so they
 * stay visually in sync with each other and inherit the surrounding text
 * colour. Kept local to the package card to avoid bloating the global UI.
 */

type IconProps = { className?: string };

function Line({ className, children }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function PlaneTakeoffIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M2 22h20" />
      <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z" />
    </Line>
  );
}

export function PlaneLandingIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M2 22h20" />
      <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.83.9 1.45s.35 1.17.9 1.45L8 9l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03a1 1 0 0 1-1.11 1.5L4.14 11.95a2 2 0 0 1-.37-.18Z" />
    </Line>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </Line>
  );
}

export function CalendarIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
    </Line>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Line>
  );
}

export function MapPinIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </Line>
  );
}

export function TicketIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
      <path d="M13 5v2" />
      <path d="M13 11v2" />
      <path d="M13 17v2" />
    </Line>
  );
}

export function SeatIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M19 9V6a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v3" />
      <path d="M3 11v5a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v1H7v-1a2 2 0 0 0-4 0Z" />
      <path d="M5 18v2" />
      <path d="M19 18v2" />
    </Line>
  );
}

export function ShieldCheckIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </Line>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M11.48 3.5a.58.58 0 0 1 1.04 0l2.28 4.62a.58.58 0 0 0 .44.32l5.1.74a.58.58 0 0 1 .32.99l-3.69 3.6a.58.58 0 0 0-.17.51l.87 5.08a.58.58 0 0 1-.84.61l-4.56-2.4a.58.58 0 0 0-.54 0l-4.56 2.4a.58.58 0 0 1-.84-.61l.87-5.08a.58.58 0 0 0-.17-.51l-3.69-3.6a.58.58 0 0 1 .32-.99l5.1-.74a.58.58 0 0 0 .44-.32z" />
    </svg>
  );
}

// --- Included-services icons -------------------------------------------------

export function AccommodationIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M8 7h.01" />
      <path d="M12 7h.01" />
      <path d="M16 7h.01" />
      <path d="M8 11h.01" />
      <path d="M12 11h.01" />
      <path d="M16 11h.01" />
      <path d="M9 16a4 4 0 0 1 6 0" />
      <path d="M10 22v-5.5" />
      <path d="M14 22v-5.5" />
    </Line>
  );
}

export function TransportIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10H4z" />
      <path d="M4 11h16" />
      <path d="M8 4v7" />
      <path d="M16 4v7" />
      <path d="M4 16v2" />
      <path d="M20 16v2" />
      <circle cx="8" cy="19" r="1.4" />
      <circle cx="16" cy="19" r="1.4" />
    </Line>
  );
}

export function VisaIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <circle cx="12" cy="10" r="3.2" />
      <path d="M8.8 10h6.4" />
      <path d="M12 6.8c1.5 1 1.5 5.4 0 6.4" />
      <path d="M12 6.8c-1.5 1-1.5 5.4 0 6.4" />
      <path d="M9.5 17.5h5" />
    </Line>
  );
}

export function ReturnTicketIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </Line>
  );
}

export function SupportIcon({ className }: IconProps) {
  return (
    <Line className={className}>
      <path d="M3 14v-2a9 9 0 0 1 18 0v2" />
      <path d="M3 14a2 2 0 0 1 2-2h1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2z" />
      <path d="M21 14a2 2 0 0 0-2-2h-1a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h1" />
      <path d="M19 17v1a3 3 0 0 1-3 3h-4" />
    </Line>
  );
}
