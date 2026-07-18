"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PackageCard } from "@/components/packages/PackageCard";
import { DepartureCalendar } from "@/components/packages/DepartureCalendar";
import { clsx } from "@/lib/clsx";
import { formatDate } from "@/lib/format";
import type { UmrahPackage } from "@/data/types";
import type { CityOption } from "@/lib/data/cities";

/**
 * Sentinel used by the "Select All" choices in the Airline / Package dropdowns.
 * Picking it widens the filter to every option in that step.
 */
const ALL = "__all__";

/**
 * Per-date price numbering. Within each departure date, the cheapest package
 * (by its "from" price) becomes Package 1, the next Package 2, and so on.
 */
function buildNumbering(packages: UmrahPackage[]): Map<string, number> {
  const byDate = new Map<string, UmrahPackage[]>();
  for (const p of packages) {
    const arr = byDate.get(p.departureDate) ?? [];
    arr.push(p);
    byDate.set(p.departureDate, arr);
  }
  const map = new Map<string, number>();
  for (const arr of byDate.values()) {
    arr
      .slice()
      .sort((a, b) => a.pricePkr - b.pricePkr || a.id.localeCompare(b.id))
      .forEach((p, i) => map.set(p.id, i + 1));
  }
  return map;
}

/**
 * Progressive package finder. The filters cascade — City → Airline → Package →
 * Date — each staying locked until the previous is chosen, only ever offering
 * options that still have available packages. The Package step is a *class*
 * grouped by duration (e.g. "20 Days Package") rather than one entry per dated
 * departure; the specific date is then chosen from the calendar.
 */
export function PackageBoard({
  packages,
  cities,
  airlines,
}: {
  packages: UmrahPackage[];
  cities: CityOption[];
  airlines: string[];
}) {
  // Sold-out departures are never shown.
  const availablePackages = useMemo(
    () => packages.filter((p) => p.seatsAvailable > 0),
    [packages],
  );

  const [city, setCity] = useState<string | null>(null);
  const [airline, setAirline] = useState<string | null>(null);
  // "Package" is now a duration class (e.g. "20" → "20 Days Package"), or ALL.
  const [durationClass, setDurationClass] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const matchesAirline = (p: UmrahPackage) => airline === ALL || p.airline === airline;
  const matchesClass = (p: UmrahPackage) =>
    durationClass === ALL || String(p.durationDays) === durationClass;

  // --- Cascading option lists (each narrows the next) --------------------
  const cityOptions = useMemo(() => {
    const codes = new Set(availablePackages.map((p) => p.departureCityCode));
    return cities.filter((c) => codes.has(c.code));
  }, [availablePackages, cities]);

  const airlineOptions = useMemo(() => {
    if (!city) return [];
    const set = new Set(
      availablePackages.filter((p) => p.departureCityCode === city).map((p) => p.airline),
    );
    return airlines.filter((a) => set.has(a));
  }, [availablePackages, city, airlines]);

  // Distinct duration classes for the current city + airline, ascending.
  const classOptions = useMemo(() => {
    if (!city || !airline) return [];
    const set = new Set(
      availablePackages
        .filter((p) => p.departureCityCode === city && matchesAirline(p))
        .map((p) => p.durationDays),
    );
    return Array.from(set).sort((a, b) => a - b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePackages, city, airline]);

  // The calendar shows the chosen class's upcoming departures (city + airline + class).
  const routePackages = useMemo(
    () =>
      city && airline && durationClass
        ? availablePackages.filter(
            (p) => p.departureCityCode === city && matchesAirline(p) && matchesClass(p),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availablePackages, city, airline, durationClass],
  );

  // Numbering is per departure date across the current route set.
  const numbering = useMemo(() => buildNumbering(routePackages), [routePackages]);

  const results = useMemo(() => {
    if (!city || !airline || !durationClass || !selectedDate) return [];
    return availablePackages
      .filter(
        (p) =>
          p.departureCityCode === city &&
          matchesAirline(p) &&
          matchesClass(p) &&
          p.departureDate === selectedDate,
      )
      .sort((a, b) => (numbering.get(a.id) ?? 0) - (numbering.get(b.id) ?? 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePackages, city, airline, durationClass, selectedDate, numbering]);

  // --- Cascading resets: changing a step clears everything downstream ----
  const onCityChange = (v: string) => {
    setCity(v);
    setAirline(null);
    setDurationClass(null);
    setSelectedDate(null);
  };
  const onAirlineChange = (v: string) => {
    setAirline(v);
    setDurationClass(null);
    setSelectedDate(null);
  };
  const onClassChange = (v: string) => {
    // Selecting a package class reveals the calendar; the date is picked there.
    setDurationClass(v);
    setSelectedDate(null);
  };
  const handleSelectDate = (date: string) => {
    setSelectedDate((cur) => (cur === date ? null : date));
  };
  const reset = () => {
    setCity(null);
    setAirline(null);
    setDurationClass(null);
    setSelectedDate(null);
  };

  useEffect(() => {
    if (!durationClass || selectedDate || !calendarRef.current) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    calendarRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [durationClass, selectedDate]);

  useEffect(() => {
    if (!results.length || !resultsRef.current) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduceMotion ? "auto" : "smooth";

    const raf = requestAnimationFrame(() => {
      const el = resultsRef.current;
      if (!el) return;
      // Always land on the TOP of the results (the first package), not the
      // bottom — a tall result set must never scroll past to the last card.
      const navOffset = 80;
      const rect = el.getBoundingClientRect();
      const absTop = window.scrollY + rect.top;
      window.scrollTo({ top: Math.max(0, absTop - navOffset), behavior });
    });

    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 1400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [selectedDate, results.length]);

  const stepHint = !city
    ? "Select your departure city to begin."
    : !airline
      ? "Now choose your airline."
      : !durationClass
        ? "Select a package to continue."
        : !selectedDate
          ? "Almost there — pick your departure date from the calendar above."
          : "No packages match your selection.";

  return (
    <div>
      {/* Progressive filters */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="1 · Departure City">
            <Select value={city} onChange={onCityChange} placeholder="Select City">
              {cityOptions.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
          </Field>

          <Field label="2 · Airline" muted={!city}>
            <Select value={airline} onChange={onAirlineChange} placeholder="Select Airline" disabled={!city}>
              {airlineOptions.length > 1 && <option value={ALL}>All Airlines</option>}
              {airlineOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="3 · Package" muted={!airline}>
            <Select value={durationClass} onChange={onClassChange} placeholder="Select Package" disabled={!airline}>
              {classOptions.length > 1 && <option value={ALL}>All Packages</option>}
              {classOptions.map((d) => (
                <option key={d} value={String(d)}>
                  {d} Days Package
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {city && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
            >
              <Icon name="restart_alt" className="text-base" /> Reset filters
            </button>
          </div>
        )}

        {/* Calendar appears once a package class is chosen */}
        {durationClass && (
          <div ref={calendarRef} className="mt-5 scroll-mt-24 border-t border-outline-variant/40 pt-5">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-[var(--font-heading)] text-lg text-on-surface md:text-xl">
                  4 · Choose a Departure Date
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Tap the highlighted day to see your package details below. Later months appear beneath.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
                <span className="h-2.5 w-2.5 rounded-sm border border-secondary/40 bg-secondary-container" />
                Seats open
              </span>
            </div>
            <div className="mt-4">
              <DepartureCalendar
                packages={routePackages}
                selectedDate={selectedDate}
                onSelect={handleSelectDate}
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div ref={resultsRef} className="mt-10 scroll-mt-28">
        {results.length > 0 ? (
          <>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
                <Icon name="event" className="text-base text-secondary-fixed" />
                Departure on {formatDate(selectedDate!)}
              </span>
              <p className="text-sm text-on-surface-variant">
                <span className="font-semibold text-on-surface">{results.length}</span>{" "}
                package{results.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div
              className={clsx(
                "grid grid-cols-1 gap-6 rounded-2xl p-1",
                "transition-shadow duration-700",
                highlight && "shadow-[0_0_0_3px_var(--color-secondary-fixed)]",
              )}
            >
              {results.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} packageNumber={numbering.get(pkg.id)} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-14 text-center">
            <Icon name="filter_list" className="text-5xl text-on-surface-variant/70" />
            <p className="mt-4 font-[var(--font-heading)] text-lg text-on-surface">{stepHint}</p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Follow the steps above to find your ideal Umrah package.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  muted,
  children,
}: {
  label: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className={clsx(
          "mb-1.5 block text-xs font-semibold uppercase tracking-wider",
          muted ? "text-on-surface-variant/50" : "text-on-surface-variant",
        )}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  placeholder,
  disabled,
  children,
}: {
  value: string | null;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={clsx(
          "w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface",
          "focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
      <Icon
        name={disabled ? "lock" : "expand_more"}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
      />
    </div>
  );
}
