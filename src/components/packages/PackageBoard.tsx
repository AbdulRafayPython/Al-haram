"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PackageCard } from "@/components/packages/PackageCard";
import { DepartureCalendar } from "@/components/packages/DepartureCalendar";
import { clsx } from "@/lib/clsx";
import { formatDate } from "@/lib/format";
import { departureCities, airlines } from "@/data/packages";
import type { UmrahPackage } from "@/data/types";

const durations = [14, 21, 28];

export function PackageBoard({ packages }: { packages: UmrahPackage[] }) {
  // Sold-out departures are never shown, so every filter operates on the
  // available subset from the start.
  const availablePackages = useMemo(
    () => packages.filter((p) => p.seatsAvailable > 0),
    [packages],
  );

  // With no "all" option on any dropdown, default every field to the
  // soonest available departure so the board never opens on an empty result.
  const defaults = useMemo(() => {
    const earliest = [...availablePackages].sort(
      (a, b) => +new Date(a.departureDate) - +new Date(b.departureDate),
    )[0];
    return {
      city: earliest?.departureCityCode ?? departureCities[0].code,
      airline: earliest?.airline ?? airlines[0],
      duration: String(earliest?.durationDays ?? durations[0]),
    };
  }, [availablePackages]);

  const [city, setCity] = useState(defaults.city);
  const [airline, setAirline] = useState(defaults.airline);
  const [duration, setDuration] = useState(defaults.duration);
  const [sort, setSort] = useState<"date" | "price-asc" | "price-desc">("date");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Everything except the calendar's date filter — also feeds the calendar's
  // per-day seat counts so they stay in sync with the dropdown filters.
  const baseFiltered = useMemo(
    () =>
      availablePackages.filter((p) => {
        if (p.departureCityCode !== city) return false;
        if (p.airline !== airline) return false;
        if (p.durationDays !== Number(duration)) return false;
        return true;
      }),
    [availablePackages, city, airline, duration],
  );

  const filtered = useMemo(() => {
    const result = (
      selectedDate
        ? baseFiltered.filter((p) => p.departureDate === selectedDate)
        : baseFiltered
    ).slice();

    result.sort((a, b) => {
      if (sort === "price-asc") return a.pricePkr - b.pricePkr;
      if (sort === "price-desc") return b.pricePkr - a.pricePkr;
      return +new Date(a.departureDate) - +new Date(b.departureDate);
    });
    return result;
  }, [baseFiltered, selectedDate, sort]);

  // When a calendar day is picked, bring the matching cards into view so the
  // user never has to hunt for where the results appeared.
  useEffect(() => {
    if (!selectedDate || !resultsRef.current) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resultsRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });

    setHighlight(true);
    const timer = window.setTimeout(() => setHighlight(false), 1400);
    return () => window.clearTimeout(timer);
  }, [selectedDate]);

  const handleSelectDate = (date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  };

  const reset = () => {
    setCity(defaults.city);
    setAirline(defaults.airline);
    setDuration(defaults.duration);
    setSort("date");
    setSelectedDate(null);
  };

  const hasFilters =
    city !== defaults.city ||
    airline !== defaults.airline ||
    duration !== defaults.duration ||
    selectedDate !== null;

  return (
    <div>
      {/* Filters + departure calendar */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Departure City">
            <Select value={city} onChange={setCity}>
              {departureCities.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Airline">
            <Select value={airline} onChange={setAirline}>
              {airlines.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duration">
            <Select value={duration} onChange={setDuration}>
              {durations.map((d) => (
                <option key={d} value={d}>
                  {d} days
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Sort By">
            <Select value={sort} onChange={(v) => setSort(v as typeof sort)}>
              <option value="date">Earliest Departure</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </Select>
          </Field>
        </div>

        {hasFilters && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
            >
              <Icon name="restart_alt" className="text-base" /> Reset filters
            </button>
          </div>
        )}

        {/* Departure calendar — merged into the filters card */}
        <div className="mt-5 border-t border-outline-variant/40 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <h3 className="font-[var(--font-heading)] text-lg text-on-surface md:text-xl">
                Departure Calendar
              </h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Tap any highlighted day — we&rsquo;ll jump you straight to its
                packages below.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs text-on-surface-variant">
              <span className="h-2.5 w-2.5 rounded-sm border border-secondary/40 bg-secondary-container" />
              Seats open
            </span>
          </div>

          <div className="mt-4">
            <DepartureCalendar
              packages={baseFiltered}
              selectedDate={selectedDate}
              onSelect={handleSelectDate}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="mt-10 scroll-mt-28">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {selectedDate ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary">
              <Icon name="event" className="text-base text-secondary-fixed" />
              Departures on {formatDate(selectedDate)}
              <button
                onClick={() => setSelectedDate(null)}
                aria-label="Clear selected date"
                className="-mr-1 ml-1 inline-flex items-center rounded-full p-0.5 transition-colors hover:bg-on-primary/15"
              >
                <Icon name="close" className="text-base" />
              </button>
            </span>
          ) : (
            <p className="text-sm text-on-surface-variant">
              Showing{" "}
              <span className="font-semibold text-on-surface">{filtered.length}</span> of{" "}
              {availablePackages.length} departures
            </p>
          )}

          {selectedDate && (
            <p className="text-sm text-on-surface-variant">
              <span className="font-semibold text-on-surface">{filtered.length}</span>{" "}
              package{filtered.length === 1 ? "" : "s"} on this date
            </p>
          )}
        </div>

        {filtered.length > 0 ? (
          <div
            className={clsx(
              "mt-5 grid grid-cols-1 gap-6 rounded-2xl p-1 md:grid-cols-2 lg:grid-cols-3",
              "transition-shadow duration-700",
              highlight && "shadow-[0_0_0_3px_var(--color-secondary-fixed)]",
            )}
          >
            {filtered.map((pkg) => (
              <PackageCard key={pkg.id} pkg={pkg} />
            ))}
          </div>
        ) : (
          <div className="mt-5 flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-16 text-center">
            <Icon name="search_off" className="text-5xl text-on-surface-variant" />
            <p className="mt-4 font-[var(--font-heading)] text-xl text-on-surface">
              No matching departures
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {selectedDate
                ? "No packages on this date match your filters. Try clearing the date or widening your filters."
                : "Try widening your filters or reset to see everything."}
            </p>
            <button
              onClick={reset}
              className="mt-5 inline-flex items-center gap-1 rounded-lg bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-primary"
            >
              Reset filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={clsx(
          "w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface",
          "focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20",
        )}
      >
        {children}
      </select>
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
      />
    </div>
  );
}
