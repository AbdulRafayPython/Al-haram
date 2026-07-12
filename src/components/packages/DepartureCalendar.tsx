"use client";

import { useMemo, useState } from "react";
import { clsx } from "@/lib/clsx";
import type { UmrahPackage } from "@/data/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface DayInfo {
  seats: number;
  count: number;
}

interface MonthCell {
  year: number;
  /** 0-indexed month */
  month: number;
  key: string; // "YYYY-MM"
  seats: number;
}

/** Build a stable `YYYY-MM-DD` key from calendar parts (matches package.departureDate). */
function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface DepartureCalendarProps {
  /** Packages already narrowed by every filter EXCEPT date. */
  packages: UmrahPackage[];
  selectedDate: string | null;
  onSelect: (date: string) => void;
}

/**
 * A multi-month departure board. Every month with a departure is rendered in a
 * wrapping grid — three per row on desktop, then flowing onto the next row —
 * so later months appear *below*, never behind a horizontal swipe. A month
 * filter jumps to a single month's availability.
 */
export function DepartureCalendar({ packages, selectedDate, onSelect }: DepartureCalendarProps) {
  const { months, byDate } = useMemo(() => {
    const byDate = new Map<string, DayInfo>();
    for (const p of packages) {
      const cur = byDate.get(p.departureDate) ?? { seats: 0, count: 0 };
      cur.seats += p.seatsAvailable;
      cur.count += 1;
      byDate.set(p.departureDate, cur);
    }

    const monthMap = new Map<string, MonthCell>();
    for (const [dateStr, info] of byDate) {
      const [y, m] = dateStr.split("-").map(Number);
      const key = `${y}-${String(m).padStart(2, "0")}`;
      const existing = monthMap.get(key);
      if (existing) existing.seats += info.seats;
      else monthMap.set(key, { year: y, month: m - 1, key, seats: info.seats });
    }
    const months = [...monthMap.values()].sort((a, b) => a.year - b.year || a.month - b.month);

    return { months, byDate };
  }, [packages]);

  const [monthFilter, setMonthFilter] = useState<string | null>(null);

  if (months.length === 0) return null;

  const selectedMonth = selectedDate ? selectedDate.slice(0, 7) : null;
  // Show every month by default; when a month is filtered, still keep the month
  // that holds the selected date visible so the chosen day is never hidden.
  const displayedMonths = monthFilter
    ? months.filter((m) => m.key === monthFilter || m.key === selectedMonth)
    : months;

  return (
    <div>
      {/* Month filter */}
      {months.length > 1 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-on-surface-variant">
            Month
          </span>
          <MonthChip active={monthFilter === null} onClick={() => setMonthFilter(null)}>
            All
          </MonthChip>
          {months.map((m) => (
            <MonthChip
              key={m.key}
              active={monthFilter === m.key}
              onClick={() => setMonthFilter(m.key)}
            >
              {SHORT_MONTHS[m.month]} {m.year}
              <span className="ml-1 text-[0.6rem] text-secondary">· {m.seats} seats</span>
            </MonthChip>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {displayedMonths.map((mo) => (
          <MonthGrid
            key={mo.key}
            year={mo.year}
            month={mo.month}
            byDate={byDate}
            selectedDate={selectedDate}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function MonthChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed",
        active
          ? "border-secondary bg-secondary-container text-on-secondary-container"
          : "border-outline-variant/60 text-on-surface-variant hover:border-secondary/50 hover:text-on-surface",
      )}
    >
      {children}
    </button>
  );
}

function MonthGrid({
  year,
  month,
  byDate,
  selectedDate,
  onSelect,
}: {
  year: number;
  month: number;
  byDate: Map<string, DayInfo>;
  selectedDate: string | null;
  onSelect: (date: string) => void;
}) {
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array<null>(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-2.5 shadow-sm">
      <p className="mb-1.5 flex items-baseline justify-between font-[var(--font-heading)] text-sm text-on-surface">
        {MONTH_NAMES[month]}
        <span className="text-[0.7rem] font-medium text-on-surface-variant">{year}</span>
      </p>

      <div className="grid grid-cols-7 gap-0.5 text-center">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="pb-0.5 text-[0.5rem] font-semibold uppercase tracking-wide text-on-surface-variant"
          >
            {d}
          </span>
        ))}

        {cells.map((day, i) => {
          if (day === null) return <span key={`pad-${i}`} aria-hidden="true" />;

          const key = dateKey(year, month, day);
          const info = byDate.get(key);
          const isSelected = selectedDate === key;

          if (!info) {
            return (
              <span
                key={key}
                className="flex h-7 items-center justify-center rounded-md text-[0.7rem] text-on-surface-variant/35"
              >
                {day}
              </span>
            );
          }

          const seatLabel = `${info.seats} seat${info.seats === 1 ? "" : "s"}`;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${day} ${MONTH_NAMES[month]} ${year} — ${seatLabel}`}
              className={clsx(
                "flex h-7 flex-col items-center justify-center rounded-md text-[0.7rem] font-semibold leading-none transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed",
                isSelected
                  ? "bg-primary text-on-primary shadow-md ring-2 ring-secondary-fixed"
                  : "border border-secondary/25 bg-secondary-container/40 text-on-surface hover:bg-secondary-container hover:shadow-sm",
              )}
            >
              <span>{day}</span>
              <span
                className={clsx(
                  "mt-0.5 text-[0.5rem] font-medium",
                  isSelected ? "text-secondary-fixed" : "text-secondary",
                )}
              >
                {info.seats}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
