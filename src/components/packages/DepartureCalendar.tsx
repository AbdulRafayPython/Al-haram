"use client";

import { useEffect, useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import type { UmrahPackage } from "@/data/types";

/** How many months the largest layout shows side by side at once. */
const MAX_VISIBLE = 3;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
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
      const cur = byDate.get(p.departureDate) ?? { seats: 0, count: 0 };
      cur.seats += p.seatsAvailable;
      cur.count += 1;
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

  // How many months fit side by side: 1 on phones, 2 on tablets, up to 3 on
  // desktop. Starts at the desktop default and self-corrects after mount.
  const [visible, setVisible] = useState(MAX_VISIBLE);
  useEffect(() => {
    const mqLg = window.matchMedia("(min-width: 1024px)");
    const mqSm = window.matchMedia("(min-width: 640px)");
    const update = () => setVisible(mqLg.matches ? 3 : mqSm.matches ? 2 : 1);
    update();
    mqLg.addEventListener("change", update);
    mqSm.addEventListener("change", update);
    return () => {
      mqLg.removeEventListener("change", update);
      mqSm.removeEventListener("change", update);
    };
  }, []);

  // Sliding window over the months. Paging by one keeps navigation smooth and
  // avoids stranding a lone month on its own page. `windowStart` is driven by
  // the arrows; `prevSelected`/`prevVisible` let us reconcile it during render.
  // (A route change unmounts the calendar entirely, so no reset is needed.)
  const [windowStart, setWindowStart] = useState(0);
  const [prevSelected, setPrevSelected] = useState<string | null>(null);
  const [prevVisible, setPrevVisible] = useState(visible);

  if (months.length === 0) return null;

  const maxStart = Math.max(0, months.length - visible);

  // Adjust the window while rendering (React's supported alternative to an
  // effect) so the month holding the selected date stays on-screen — whether it
  // was set via the Package dropdown or the visible column count just changed —
  // while still honouring manual paging via the arrows.
  let start = Math.min(windowStart, maxStart);
  if ((selectedDate !== prevSelected || visible !== prevVisible) && selectedDate) {
    const target = selectedDate.slice(0, 7); // YYYY-MM
    const idx = months.findIndex(
      (m) => `${m.year}-${String(m.month + 1).padStart(2, "0")}` === target,
    );
    if (idx !== -1) {
      if (idx < start) start = Math.min(idx, maxStart);
      else if (idx > start + visible - 1) start = Math.min(idx - visible + 1, maxStart);
    }
  }
  if (selectedDate !== prevSelected) setPrevSelected(selectedDate);
  if (visible !== prevVisible) setPrevVisible(visible);
  if (start !== windowStart) setWindowStart(start);

  const shown = months.slice(start, start + visible);
  const canPrev = start > 0;
  const canNext = start < maxStart;
  const page = (dir: -1 | 1) =>
    setWindowStart(Math.min(Math.max(start + dir, 0), maxStart));

  const first = shown[0];
  const last = shown[shown.length - 1];
  const rangeLabel =
    first === last
      ? `${MONTH_NAMES[first.month]} ${first.year}`
      : `${SHORT_MONTHS[first.month]} ${first.year} – ${SHORT_MONTHS[last.month]} ${last.year}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-on-surface">{rangeLabel}</p>
        {months.length > visible && (
          <div className="flex items-center gap-1.5">
            <NavButton
              icon="chevron_left"
              label="Previous months"
              disabled={!canPrev}
              onClick={() => page(-1)}
            />
            <NavButton
              icon="chevron_right"
              label="Next months"
              disabled={!canNext}
              onClick={() => page(1)}
            />
          </div>
        )}
      </div>

      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: `repeat(${Math.max(shown.length, 1)}, minmax(0, 1fr))`,
        }}
      >
        {shown.map((mo) => (
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
    </div>
  );
}

function NavButton({
  icon,
  label,
  disabled,
  onClick,
}: {
  icon: string;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        "flex h-8 w-8 items-center justify-center rounded-full border border-outline-variant/60 text-on-surface transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-fixed",
        disabled
          ? "cursor-not-allowed opacity-35"
          : "hover:border-secondary hover:bg-secondary-container/50",
      )}
    >
      <Icon name={icon} className="text-xl" />
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
