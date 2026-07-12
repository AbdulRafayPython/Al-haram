"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { BlendImage } from "@/components/ui/BlendImage";
import { clsx } from "@/lib/clsx";
import { formatSar } from "@/lib/format";
import { site } from "@/data/site";
import type { Hotel, City } from "@/data/types";

const cityFilters: Array<{ key: "all" | City; label: string }> = [
  { key: "all", label: "All Cities" },
  { key: "Makkah", label: "Makkah" },
  { key: "Madinah", label: "Madinah" },
];

export function HotelGallery({ hotels }: { hotels: Hotel[] }) {
  const [city, setCity] = useState<"all" | City>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return hotels.filter((h) => {
      if (city !== "all" && h.city !== city) return false;
      if (q && !`${h.name} ${h.location}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [hotels, city, query]);

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-1">
          {cityFilters.map((c) => (
            <button
              key={c.key}
              onClick={() => setCity(c.key)}
              className={clsx(
                "rounded-md px-5 py-2 text-sm font-semibold transition-colors",
                city === c.key
                  ? "bg-primary text-on-primary"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:max-w-xs">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search hotel or location"
            className="w-full rounded-lg border border-outline-variant bg-surface py-2.5 pl-10 pr-4 text-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-on-surface-variant">
        Showing <span className="font-semibold text-on-surface">{filtered.length}</span>{" "}
        of {hotels.length} hotels
      </p>

      {filtered.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((h) => (
            <HotelCard key={h.id} hotel={h} />
          ))}
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-outline-variant bg-surface-container-low p-16 text-center">
          <Icon name="search_off" className="text-5xl text-on-surface-variant" />
          <p className="mt-4 font-[var(--font-heading)] text-xl text-on-surface">No hotels found</p>
          <p className="mt-1 text-sm text-on-surface-variant">Try a different search term or city.</p>
        </div>
      )}
    </div>
  );
}

function HotelCard({ hotel }: { hotel: Hotel }) {
  const isShuttle = hotel.distance.toLowerCase().includes("shuttle");
  const rateValues = [
    hotel.rates.sharing,
    hotel.rates.quad,
    hotel.rates.triple,
    hotel.rates.double,
  ].filter((v): v is number => typeof v === "number");
  const lowest = Math.min(...rateValues);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Visual */}
      <div className="relative h-40 overflow-hidden bg-primary">
        <BlendImage
          src={
            hotel.imageUrl ??
            (hotel.city === "Makkah" ? "/images/makkah-skyline.jpg" : "/images/madinah.jpg")
          }
          variant="photo"
          position="object-center"
        />
        <span className="absolute left-4 top-4 z-10 inline-flex items-center gap-1 rounded-full bg-primary/40 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-primary backdrop-blur-sm">
          <Icon name="location_on" className="text-sm text-secondary-fixed" />
          {hotel.city}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-[var(--font-heading)] text-lg text-on-surface">{hotel.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-on-surface-variant">
          <Icon name="location_on" className="text-base text-secondary" />
          {hotel.location}
        </p>
        <p
          className={clsx(
            "mt-3 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            isShuttle
              ? "bg-surface-container text-on-surface-variant"
              : "bg-success/10 text-success",
          )}
        >
          <Icon name={isShuttle ? "directions_bus" : "directions_walk"} className="text-base" />
          {isShuttle ? "Shuttle Service" : `${hotel.distance} from Haram`}
        </p>

        {/* Rates */}
        <div className="mt-5 grid grid-cols-4 gap-2 border-t border-outline-variant/40 pt-4 text-center">
          <Rate label="Share" value={hotel.rates.sharing} />
          <Rate label="Quad" value={hotel.rates.quad} />
          <Rate label="Triple" value={hotel.rates.triple} />
          <Rate label="Double" value={hotel.rates.double} />
        </div>

        <div className="mt-auto flex items-end justify-between pt-5">
          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">From</p>
            <p className="font-[var(--font-heading)] text-xl text-on-surface">{formatSar(lowest)}</p>
            <p className="text-xs text-on-surface-variant">per night</p>
          </div>
          <a
            href={`${site.whatsappHref}?text=I'd like to book ${encodeURIComponent(hotel.name)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105"
          >
            Book <Icon name="arrow_forward" className="text-base" />
          </a>
        </div>
      </div>
    </article>
  );
}

function Rate({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <p className="text-[0.65rem] uppercase tracking-wide text-on-surface-variant">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-on-surface">
        {typeof value === "number" ? value : "—"}
      </p>
    </div>
  );
}
