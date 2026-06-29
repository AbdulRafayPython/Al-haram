"use client";

import { useMemo } from "react";
import { clsx } from "@/lib/clsx";
import type { UmrahPackage } from "@/data/types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface DayInfo {
  seats: number;
  count: number;
  soldOut: boolean;
}

interface MonthCell {
  year: number;
  /** 0-indexed month */
  month: number;
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
 * A multi-month departure board. Each day that has a departure shows its live
 * seat count and is clickable; selecting one filters the package list below.
 */
export function DepartureCalendar({
  packages,
  selectedDate,
  onSelect,
}: DepartureCalendarProps) {
  const { months, byDate } = useMemo(() => {
    const byDate = new Map<string, DayInfo>();
    for (const p of packages) {
      const cur = byDate.get(p.departureDate) ?? {
        seats: 0,
        count: 0,
        soldOut: true,
      };
      cur.seats += p.seatsAvailable;
      cur.count += 1;
      cur.soldOut = cur.soldOut && p.seatsAvailable === 0;
      byDate.set(p.departureDate, cur);
    }

    const monthMap = new Map<string, MonthCell>();
    for (const key of byDate.keys()) {
      const [y, m] = key.split("-").map(Number);
      monthMap.set(`${y}-${m}`, { year: y, month: m - 1 });
    }
    const months = [...monthMap.values()].sort(
      (a, b) => a.year - b.year || a.month - b.month,
    );

    return { months, byDate };
  }, [packages]);

  if (months.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {months.map((mo) => (
        <MonthGrid
          key={`${mo.year}-${mo.month}`}
          year={mo.year}
          month={mo.month}
          byDate={byDate}
          selectedDate={selectedDate}
          onSelect={onSelect}
        />
      ))}
    </div>
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
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm">
      <p className="mb-3 flex items-baseline justify-between font-[var(--font-heading)] text-lg text-primary">
        {MONTH_NAMES[month]}
        <span className="text-sm font-medium text-on-surface-variant">{year}</span>
      </p>

      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="pb-1 text-[0.6rem] font-semibold uppercase tracking-wider text-on-surface-variant"
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
                className="flex aspect-square items-center justify-center rounded-md text-sm text-on-surface-variant/35"
              >
                {day}
              </span>
            );
          }

          const seatLabel = info.soldOut
            ? "Sold out"
            : `${info.seats} seat${info.seats === 1 ? "" : "s"}`;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              aria-pressed={isSelected}
              aria-label={`${day} ${MONTH_NAMES[month]} ${year} — ${seatLabel}`}
              className={clsx(
                "flex aspect-square flex-col items-center justify-center rounded-md text-sm font-semibold transition-all",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed",
                isSelected
                  ? "bg-primary text-on-primary shadow-md ring-2 ring-secondary-fixed"
                  : info.soldOut
                    ? "border border-outline-variant/60 bg-surface-container text-on-surface-variant hover:border-outline"
                    : "border border-secondary/25 bg-secondary-container/40 text-on-surface hover:bg-secondary-container hover:shadow-sm",
              )}
            >
              <span className="leading-none">{day}</span>
              <span
                className={clsx(
                  "mt-0.5 text-[0.55rem] font-medium leading-none",
                  isSelected
                    ? "text-secondary-fixed"
                    : info.soldOut
                      ? "text-on-surface-variant/70"
                      : "text-secondary",
                )}
              >
                {info.soldOut ? "0 seats" : info.seats}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
