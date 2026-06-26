import { clsx } from "@/lib/clsx";

interface SeatBadgeProps {
  available: number;
  total: number;
}

/** Colour-coded availability indicator: green (open), amber (limited), red (sold out). */
export function SeatBadge({ available, total }: SeatBadgeProps) {
  const soldOut = available === 0;
  const limited = !soldOut && available <= Math.max(5, total * 0.2);

  const label = soldOut
    ? "Sold Out"
    : limited
      ? `Only ${available} seats left`
      : `${available} seats available`;

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
        soldOut && "bg-error/10 text-error",
        limited && "bg-secondary-container text-on-secondary-container",
        !soldOut && !limited && "bg-success/10 text-success",
      )}
    >
      <span
        className={clsx(
          "h-1.5 w-1.5 rounded-full",
          soldOut ? "bg-error" : limited ? "bg-secondary" : "bg-success",
        )}
      />
      {label}
    </span>
  );
}
