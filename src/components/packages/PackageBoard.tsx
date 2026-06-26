"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PackageCard } from "@/components/packages/PackageCard";
import { clsx } from "@/lib/clsx";
import { departureCities, airlines } from "@/data/packages";
import type { UmrahPackage } from "@/data/types";

const durations = [14, 21, 28];

export function PackageBoard({ packages }: { packages: UmrahPackage[] }) {
  const [city, setCity] = useState("all");
  const [airline, setAirline] = useState("all");
  const [duration, setDuration] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<"date" | "price-asc" | "price-desc">("date");

  const filtered = useMemo(() => {
    const result = packages.filter((p) => {
      if (city !== "all" && p.departureCityCode !== city) return false;
      if (airline !== "all" && p.airline !== airline) return false;
      if (duration !== "all" && p.durationDays !== Number(duration)) return false;
      if (availableOnly && p.seatsAvailable === 0) return false;
      return true;
    });

    result.sort((a, b) => {
      if (sort === "price-asc") return a.pricePkr - b.pricePkr;
      if (sort === "price-desc") return b.pricePkr - a.pricePkr;
      return +new Date(a.departureDate) - +new Date(b.departureDate);
    });
    return result;
  }, [packages, city, airline, duration, availableOnly, sort]);

  const reset = () => {
    setCity("all");
    setAirline("all");
    setDuration("all");
    setAvailableOnly(false);
    setSort("date");
  };

  const hasFilters =
    city !== "all" || airline !== "all" || duration !== "all" || availableOnly;

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Departure City">
            <Select value={city} onChange={setCity}>
              <option value="all">All Cities</option>
              {departureCities.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name} ({c.code})
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Airline">
            <Select value={airline} onChange={setAirline}>
              <option value="all">All Airlines</option>
              {airlines.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duration">
            <Select value={duration} onChange={setDuration}>
              <option value="all">Any Duration</option>
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

        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/40 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-on-surface-variant">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="h-4 w-4 accent-primary"
            />
            Show available seats only
          </label>
          {hasFilters && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline"
            >
              <Icon name="restart_alt" className="text-base" /> Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <p className="mt-6 text-sm text-on-surface-variant">
        Showing <span className="font-semibold text-primary">{filtered.length}</span>{" "}
        of {packages.length} departures
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((pkg) => (
            <PackageCard key={pkg.id} pkg={pkg} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-16 text-center">
          <Icon name="search_off" className="text-5xl text-on-surface-variant" />
          <p className="mt-4 font-[var(--font-heading)] text-xl text-primary">
            No matching departures
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Try widening your filters or reset to see everything.
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
