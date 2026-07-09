"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PackageCard } from "@/components/packages/PackageCard";
import { DepartureCalendar } from "@/components/packages/DepartureCalendar";
import { clsx } from "@/lib/clsx";
import { formatDate, formatPkr } from "@/lib/format";
import { departureCities, airlines } from "@/data/packages";
import type { UmrahPackage } from "@/data/types";

/**
 * Sentinel used by the "Select All" choices in the Airline and Package
 * dropdowns. Picking it widens the filter to every option in that step.
 */
const ALL = "__all__";

/**
 * Progressive package finder. The filters cascade in a fixed order —
 * City → Airline → Package → Date — and each step stays locked until the
 * previous one is chosen, only ever offering options that still have
 * available packages given the earlier picks. Airline and Package each also
 * offer a "Select All" choice that opens the step up to every option at once.
 */
export function PackageBoard({ packages }: { packages: UmrahPackage[] }) {
  // Sold-out departures are never shown.
  const availablePackages = useMemo(
    () => packages.filter((p) => p.seatsAvailable > 0),
    [packages],
  );

  const [city, setCity] = useState<string | null>(null);
  const [airline, setAirline] = useState<string | null>(null);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);

  const resultsRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  // --- Cascading option lists (each narrows the next) --------------------
  const cityOptions = useMemo(() => {
    const codes = new Set(availablePackages.map((p) => p.departureCityCode));
    return departureCities.filter((c) => codes.has(c.code));
  }, [availablePackages]);

  const airlineOptions = useMemo(() => {
    if (!city) return [];
    const set = new Set(
      availablePackages
        .filter((p) => p.departureCityCode === city)
        .map((p) => p.airline),
    );
    return airlines.filter((a) => set.has(a));
  }, [availablePackages, city]);

  // `airline === ALL` keeps every carrier operating from the chosen city.
  const matchesAirline = (p: UmrahPackage) => airline === ALL || p.airline === airline;

  const packageOptions = useMemo(() => {
    if (!city || !airline) return [];
    return availablePackages
      .filter((p) => p.departureCityCode === city && matchesAirline(p))
      .sort((a, b) => +new Date(a.departureDate) - +new Date(b.departureDate));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePackages, city, airline]);

  // The calendar shows the whole route's upcoming departures (city + airline,
  // or city + every airline when "All Airlines" is picked), so multiple months
  // appear whenever the route flies in more than one month. Months with no
  // available seats simply never get built, so they stay hidden.
  const routePackages = useMemo(
    () =>
      city && airline
        ? availablePackages.filter(
            (p) => p.departureCityCode === city && matchesAirline(p),
          )
        : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [availablePackages, city, airline],
  );

  const results = useMemo(() => {
    if (!city || !airline || !selectedDate) return [];
    return availablePackages.filter(
      (p) =>
        p.departureCityCode === city &&
        matchesAirline(p) &&
        p.departureDate === selectedDate,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePackages, city, airline, selectedDate]);

  // --- Cascading resets: changing a step clears everything downstream ----
  const onCityChange = (v: string) => {
    setCity(v);
    setAirline(null);
    setPackageId(null);
    setSelectedDate(null);
  };
  const onAirlineChange = (v: string) => {
    setAirline(v);
    setPackageId(null);
    setSelectedDate(null);
  };
  const onPackageChange = (v: string) => {
    setPackageId(v);
    if (v === ALL) {
      // "All Packages" just reveals the calendar; let the user pick any date.
      setSelectedDate(null);
      return;
    }
    // Jump the calendar straight to the chosen package's departure date.
    const pkg = availablePackages.find((p) => p.id === v);
    setSelectedDate(pkg ? pkg.departureDate : null);
  };
  const handleSelectDate = (date: string) => {
    if (selectedDate === date) {
      setSelectedDate(null);
      return;
    }
    setSelectedDate(date);
    // Keep the Package dropdown in sync with the departure the user tapped,
    // unless they're browsing "All Packages" — then leave the choice as-is.
    if (packageId !== ALL) {
      const pkg = routePackages.find((p) => p.departureDate === date);
      if (pkg) setPackageId(pkg.id);
    }
  };
  const reset = () => {
    setCity(null);
    setAirline(null);
    setPackageId(null);
    setSelectedDate(null);
  };

  // When the package step is chosen the calendar unfolds — on small screens it
  // opens below the fold. Scroll it into view so "Choose a Departure Date" and
  // the calendar aren't cut off. Only runs while no date is picked yet; once a
  // date is chosen the results-scroll effect below takes over.
  useEffect(() => {
    if (!packageId || selectedDate || !calendarRef.current) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    calendarRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [packageId, selectedDate]);

  // Once the filters resolve to a set of packages, bring the results section
  // into view. Keyed on the selected date so every applied date scrolls, even
  // when consecutive picks happen to return the same number of packages.
  useEffect(() => {
    if (!results.length || !resultsRef.current) return;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    resultsRef.current.scrollIntoView({
      behavior: reduceMotion ? "auto" : "smooth",
      block: "start",
    });
    setHighlight(true);
    const t = window.setTimeout(() => setHighlight(false), 1400);
    return () => window.clearTimeout(t);
  }, [selectedDate, results.length]);

  const stepHint = !city
    ? "Select your departure city to begin."
    : !airline
      ? "Now choose your airline."
      : !packageId
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
            <Select
              value={airline}
              onChange={onAirlineChange}
              placeholder="Select Airline"
              disabled={!city}
            >
              {airlineOptions.length > 1 && <option value={ALL}>All Airlines</option>}
              {airlineOptions.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="3 · Package" muted={!airline}>
            <Select
              value={packageId}
              onChange={onPackageChange}
              placeholder="Select Package"
              disabled={!airline}
            >
              {packageOptions.length > 1 && <option value={ALL}>All Packages</option>}
              {packageOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} · {formatPkr(p.pricePkr)}
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

        {/* Step 4 — calendar appears only after a package is chosen */}
        {packageId && (
          <div
            ref={calendarRef}
            className="mt-5 scroll-mt-24 border-t border-outline-variant/40 pt-5"
          >
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h3 className="font-[var(--font-heading)] text-lg text-on-surface md:text-xl">
                  4 · Choose a Departure Date
                </h3>
                <p className="mt-1 text-sm text-on-surface-variant">
                  Tap the highlighted day to see your package details below.
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
                "grid grid-cols-1 gap-6 rounded-2xl p-1 md:grid-cols-2 lg:grid-cols-3",
                "transition-shadow duration-700",
                highlight && "shadow-[0_0_0_3px_var(--color-secondary-fixed)]",
              )}
            >
              {results.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-14 text-center">
            <Icon name="filter_list" className="text-5xl text-on-surface-variant/70" />
            <p className="mt-4 font-[var(--font-heading)] text-lg text-on-surface">
              {stepHint}
            </p>
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
