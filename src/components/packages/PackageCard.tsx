import type { ComponentType } from "react";
import { SeatBadge } from "@/components/ui/SeatBadge";
import { BlendImage } from "@/components/ui/BlendImage";
import { BookNow } from "@/components/packages/BookNow";
import { clsx } from "@/lib/clsx";
import { formatPkr, formatDate } from "@/lib/format";
import { formatClock } from "@/lib/flight";
import { includedServices } from "@/data/packages";
import { ROOM_TYPES, type RoomType, type UmrahPackage } from "@/data/types";
import {
  AccommodationIcon,
  CalendarIcon,
  MapPinIcon,
  MoonIcon,
  PlaneLandingIcon,
  PlaneTakeoffIcon,
  ReturnTicketIcon,
  SeatIcon,
  ShieldCheckIcon,
  StarIcon,
  TicketIcon,
  TransportIcon,
  VisaIcon,
} from "@/components/packages/PackageIcons";

type SvgIcon = ComponentType<{ className?: string }>;

const SERVICE_ICONS: Record<string, SvgIcon> = {
  Accommodation: AccommodationIcon,
  Transport: TransportIcon,
  Visa: VisaIcon,
  "Return Ticket": ReturnTicketIcon,
};

function airlineInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

/** "11 Aug" — day + short month, no year. */
function dayMonth(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/** Google Maps search link for a hotel so "View on map" always resolves. */
function mapsHref(hotel: string, city: string): string {
  const q = encodeURIComponent(`${hotel}, ${city}, Saudi Arabia`);
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

/**
 * Full-width "dashboard" package card. Left: the flight card (departure/return
 * times over flight numbers, airline + logo in the middle, route below) with the
 * paired price grid underneath. Right: the hotels. A bottom band carries the
 * included services and the BOOK NOW action.
 */
export function PackageCard({ pkg, packageNumber }: { pkg: UmrahPackage; packageNumber?: number }) {
  const soldOut = pkg.seatsAvailable === 0;

  const makkahNights = pkg.makkahNights ?? Math.round(pkg.durationDays * 0.6);
  const madinahNights = pkg.madinahNights ?? pkg.durationDays - makkahNights;
  const returnDate = pkg.returnDate ?? pkg.departureDate;
  const pricing = pkg.pricing ?? {
    sharing: pkg.pricePkr,
    quad: pkg.pricePkr,
    triple: pkg.pricePkr,
    double: pkg.pricePkr,
    infant: 0,
    childNoBed: 0,
  };
  const flight = pkg.flight;

  const amountFor: Record<RoomType, number> = {
    Sharing: pricing.sharing,
    Quad: pricing.quad,
    Triple: pricing.triple,
    Double: pricing.double,
  };
  // Show only the room types this package offers (fall back to all four if legacy).
  const offered = pkg.roomTypes.length ? pkg.roomTypes : ROOM_TYPES;
  const tiers = offered.map((r) => ({ label: r, amount: amountFor[r] }));
  const cheapest = tiers.length ? Math.min(...tiers.map((t) => t.amount)) : pkg.pricePkr;

  const heading = packageNumber ? `Package ${packageNumber}` : pkg.title;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-all hover:shadow-xl">
      {/* Header band ------------------------------------------------------ */}
      <div className="relative overflow-hidden bg-primary px-5 py-4 text-on-primary">
        <BlendImage src="/images/kaaba.jpg" variant="card" position="object-center" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <h3 className="font-[var(--font-heading)] text-xl leading-tight text-on-primary">
              {heading}
            </h3>
            {(pkg.groupCode || pkg.packageCode) && (
              <p className="mt-0.5 text-xs font-medium text-on-primary/70">
                {pkg.groupCode && (
                  <>
                    Group <span className="text-secondary-fixed">{pkg.groupCode}</span>
                  </>
                )}
                {pkg.groupCode && pkg.packageCode && " · "}
                {pkg.packageCode && <>Code {pkg.packageCode}</>}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-2 rounded-lg bg-on-primary/10 px-3 py-1.5 text-sm font-medium backdrop-blur-sm">
              <CalendarIcon className="h-4 w-4 text-secondary-fixed" />
              {dayMonth(pkg.departureDate)} – {formatDate(returnDate)}
              <span className="mx-0.5 h-4 w-px bg-on-primary/25" />
              <MoonIcon className="h-4 w-4 text-secondary-fixed" />
              {pkg.durationDays} Nights
            </span>
            <span
              className={clsx(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-wider ring-1",
                soldOut
                  ? "bg-error/15 text-error ring-error/30"
                  : "bg-success/15 text-success ring-success/30",
              )}
            >
              <ShieldCheckIcon className="h-3.5 w-3.5" />
              {soldOut ? "Sold Out" : "Available"}
            </span>
          </div>
        </div>
      </div>

      {/* Body: flight + price (left) | hotels (right) --------------------- */}
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Left column: flight card + price */}
        <div className="flex flex-col gap-4">
          {/* Flight card */}
          <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
            {flight ? (
              <>
                <div className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  {/* Departure + connector line to the plane */}
                  <div className="flex items-center gap-2">
                    <FlightLeg
                      Icon={PlaneTakeoffIcon}
                      label="Departure"
                      bigTime={formatClock(flight.departureTime) || "—"}
                      flightNo={flight.outboundNo}
                      date={flight.departureDate || pkg.departureDate}
                    />
                    <span className="hidden h-px flex-1 border-t border-dashed border-outline-variant/70 sm:block" />
                  </div>

                  {/* Center: airline above, plane in the middle, route below */}
                  <div className="flex flex-col items-center gap-1.5 px-1 text-center">
                    <div className="flex items-center gap-2">
                      <AirlineLogo name={pkg.airline} logoUrl={pkg.airlineLogoUrl} />
                      <span className="font-[var(--font-heading)] text-sm font-semibold text-on-surface">
                        {pkg.airline}
                      </span>
                    </div>
                    <PlaneTakeoffIcon className="h-5 w-5 text-secondary" />
                    <span className="whitespace-nowrap text-xs font-medium text-on-surface-variant">
                      {flight.route}
                    </span>
                  </div>

                  {/* Connector line from the plane to Arrival */}
                  <div className="flex items-center gap-2">
                    <span className="hidden h-px flex-1 border-t border-dashed border-outline-variant/70 sm:block" />
                    <FlightLeg
                      Icon={PlaneLandingIcon}
                      label="Arrival"
                      bigTime={formatClock(flight.arrivalTime) || "—"}
                      flightNo={flight.inboundNo}
                      date={flight.arrivalDate || returnDate}
                      alignEnd
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2.5 py-2 text-center">
                <div className="flex items-center gap-2.5">
                  <AirlineLogo name={pkg.airline} logoUrl={pkg.airlineLogoUrl} />
                  <span className="font-[var(--font-heading)] text-sm font-semibold text-on-surface">
                    {pkg.airline}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">Flight details to be confirmed</p>
              </div>
            )}
          </section>

          {/* Price section (below the flight card) — paired grid */}
          <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
            <p className="mb-2.5 text-[0.7rem] font-semibold uppercase tracking-wider text-on-surface-variant">
              Price per person (PKR)
            </p>
            <div className="grid grid-cols-1 gap-2.5 min-[400px]:grid-cols-2">
              {tiers.map((t) => {
                const best = t.amount === cheapest;
                return (
                  <div
                    key={t.label}
                    className={clsx(
                      "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
                      best
                        ? "border-secondary/50 bg-secondary-container/30"
                        : "border-outline-variant/40 bg-surface-container",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-sm text-on-surface-variant">
                      {best && <StarIcon className="h-3.5 w-3.5 shrink-0 text-secondary" />}
                      <span className="truncate">{t.label}</span>
                    </span>
                    <span
                      className={clsx(
                        "shrink-0 whitespace-nowrap font-[var(--font-heading)] tabular-nums",
                        best ? "text-sm font-semibold text-secondary" : "text-sm text-on-surface",
                      )}
                    >
                      {formatPkr(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
            {(pricing.infant > 0 || pricing.childNoBed > 0) && (
              <p className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-on-surface-variant">
                {pricing.infant > 0 && (
                  <span>
                    Infant: <span className="font-medium text-on-surface">{formatPkr(pricing.infant)}</span>
                  </span>
                )}
                {pricing.childNoBed > 0 && (
                  <span>
                    Child (No Bed):{" "}
                    <span className="font-medium text-on-surface">{formatPkr(pricing.childNoBed)}</span>
                  </span>
                )}
              </p>
            )}
          </section>

          {/* Included services — fills the left column under the price panel */}
          <div className="mt-auto rounded-lg border border-outline-variant/30 bg-surface-container-low/40 px-3.5 py-3">
            <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-on-surface-variant">
              Included
            </span>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5">
              {includedServices.map((svc) => {
                const Ic = SERVICE_ICONS[svc];
                return (
                  <span key={svc} className="inline-flex items-center gap-1.5 text-sm text-on-surface">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-secondary-container/60 text-secondary">
                      {Ic && <Ic className="h-3.5 w-3.5" />}
                    </span>
                    {svc}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: hotels + codes/seats */}
        <div className="flex flex-col gap-3 lg:border-l lg:border-outline-variant/40 lg:pl-4">
          <HotelBlock
            city="Makkah"
            label="Makkah Hotel"
            name={pkg.makkahHotel}
            nights={makkahNights}
            location={pkg.makkahLocation}
          />
          <HotelBlock
            city="Madinah"
            label="Madinah Hotel"
            name={pkg.madinahHotel}
            nights={madinahNights}
            location={pkg.madinahLocation}
          />

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3.5 py-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
              <TicketIcon className="h-4 w-4 text-secondary" />
              {pkg.packageCode ? (
                <span className="font-semibold text-on-surface">{pkg.packageCode}</span>
              ) : (
                "—"
              )}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <SeatIcon className="h-4 w-4 text-secondary" />
              <SeatBadge available={pkg.seatsAvailable} total={pkg.seatsTotal} />
            </span>
          </div>
          {/* Book now (pinned to the bottom of the right column) */}
          <div className="mt-auto pt-1">
            <BookNow
              soldOut={soldOut}
              fullWidth
              booking={{
                packageId: pkg.id,
                heading,
                airline: pkg.airline,
                departureDate: pkg.departureDate,
                fromPrice: cheapest,
                roomTypes: offered,
                prices: amountFor,
                infantPrice: pricing.infant,
                childNoBedPrice: pricing.childNoBed,
              }}
            />
          </div>
        </div>
      </div>
    </article>
  );
}

// --- Subcomponents ----------------------------------------------------------

function AirlineLogo({ name, logoUrl }: { name: string; logoUrl?: string | null }) {
  if (logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={logoUrl} alt={name} className="h-8 w-8 rounded-md bg-white/90 object-contain p-0.5" />;
  }
  return (
    <span className="flex h-8 min-w-8 items-center justify-center rounded-md bg-secondary-container px-1.5 text-[0.7rem] font-bold tracking-wide text-on-secondary-container">
      {airlineInitials(name)}
    </span>
  );
}

function FlightLeg({
  Icon,
  label,
  bigTime,
  flightNo,
  date,
  alignEnd,
}: {
  Icon: SvgIcon;
  label: string;
  bigTime: string;
  flightNo: string;
  date: string;
  alignEnd?: boolean;
}) {
  return (
    <div className={clsx(alignEnd && "sm:text-right")}>
      <div className={clsx("flex items-center gap-1.5", alignEnd && "sm:flex-row-reverse")}>
        <Icon className="h-4 w-4 shrink-0 text-secondary" />
        <span className="text-[0.6rem] font-semibold uppercase tracking-wider text-secondary">
          {label}
        </span>
      </div>
      {/* Departure/arrival time on top */}
      <p className="mt-1.5 font-[var(--font-heading)] text-lg leading-none text-on-surface">
        {bigTime}
      </p>
      {/* Flight number below the time */}
      {flightNo && (
        <p className="mt-1 text-sm font-semibold text-on-surface">Flight {flightNo}</p>
      )}
      <p className="mt-1 text-xs text-on-surface-variant">{formatDate(date)}</p>
    </div>
  );
}

function HotelBlock({
  city,
  label,
  name,
  nights,
  location,
}: {
  city: string;
  label: string;
  name: string;
  nights: number;
  location?: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-outline-variant/30 bg-primary-container/40 p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-secondary">{label}</p>
        <span className="inline-flex items-center gap-1 text-[0.7rem] font-medium text-on-surface-variant">
          <MoonIcon className="h-3 w-3" />
          {nights} nights
        </span>
      </div>
      <h4 className="mt-1.5 font-[var(--font-heading)] text-sm leading-snug text-on-surface">
        {name} <span className="font-normal text-on-surface-variant">or similar</span>
      </h4>
      {location && (
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-snug text-on-surface-variant">
          <MapPinIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />
          {location}
        </p>
      )}
      <a
        href={mapsHref(name, city)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
      >
        <MapPinIcon className="h-3.5 w-3.5" />
        View on map
      </a>
    </div>
  );
}
