import type { ComponentType } from "react";
import { SeatBadge } from "@/components/ui/SeatBadge";
import { BlendImage } from "@/components/ui/BlendImage";
import { clsx } from "@/lib/clsx";
import { formatPkr, formatDate } from "@/lib/format";
import { site } from "@/data/site";
import { includedServices } from "@/data/packages";
import type { UmrahPackage } from "@/data/types";
import {
  AccommodationIcon,
  ArrowRightIcon,
  CalendarIcon,
  MapPinIcon,
  MoonIcon,
  PlaneLandingIcon,
  PlaneTakeoffIcon,
  ReturnTicketIcon,
  SeatIcon,
  ShieldCheckIcon,
  StarIcon,
  SupportIcon,
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
  "Premium Support": SupportIcon,
};

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
 * Full-width "dashboard" package card. Laid out horizontally — flight itinerary
 * and hotels on the left, the price table + CTA in a right rail, and included
 * services along the bottom — so the whole card fits one screen on desktop
 * without any scrolling, while carrying every detail.
 */
export function PackageCard({ pkg }: { pkg: UmrahPackage }) {
  const soldOut = pkg.seatsAvailable === 0;

  // Enriched fields are optional on the type; fall back so the card is robust
  // even if a package is ever added without them.
  const makkahNights = pkg.makkahNights ?? Math.round(pkg.durationDays * 0.6);
  const madinahNights = pkg.madinahNights ?? pkg.durationDays - makkahNights;
  const returnDate = pkg.returnDate ?? pkg.departureDate;
  const pricing = pkg.pricing ?? {
    sharing: pkg.pricePkr,
    quad: pkg.pricePkr,
    triple: pkg.pricePkr,
    double: pkg.pricePkr,
    infant: 75000,
  };
  const flight = pkg.flight;

  const tiers = [
    { label: "Sharing", amount: pricing.sharing, best: true },
    { label: "Quad", amount: pricing.quad, best: false },
    { label: "Triple", amount: pricing.triple, best: false },
    { label: "Double", amount: pricing.double, best: false },
    { label: "Infant", amount: pricing.infant, best: false },
  ];

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-all hover:shadow-xl">
      {/* Header band ------------------------------------------------------ */}
      <div className="relative overflow-hidden bg-primary px-5 py-4 text-on-primary">
        <BlendImage src="/images/kaaba.jpg" variant="card" position="object-center" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-secondary-fixed">
              {pkg.airline}
            </p>
            <h3 className="mt-0.5 font-[var(--font-heading)] text-xl leading-tight text-on-primary">
              {pkg.title}
            </h3>
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

      {/* Body: main (flight + hotels) | rail (pricing + CTA) -------------- */}
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Main column */}
        <div className="flex flex-col gap-4">
          {/* Flight itinerary */}
          {flight && (
            <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
              <div className="grid items-center gap-3 sm:grid-cols-[1fr_auto_1fr]">
                <FlightLeg
                  Icon={PlaneTakeoffIcon}
                  flightNo={flight.outboundNo}
                  date={pkg.departureDate}
                  time={flight.outboundTime}
                  bigTime={flight.departureTime}
                  bigLabel="Departure"
                />
                <ArrowRightIcon className="mx-auto h-5 w-5 rotate-90 text-on-surface-variant/60 sm:rotate-0" />
                <FlightLeg
                  Icon={PlaneLandingIcon}
                  flightNo={flight.inboundNo}
                  date={returnDate}
                  time={flight.inboundTime}
                  bigTime={flight.arrivalTime}
                  bigLabel="Arrival"
                  alignEnd
                />
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-outline-variant/30 pt-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-on-surface">
                  <PlaneTakeoffIcon className="h-3.5 w-3.5 text-secondary" />
                  {flight.route}
                </span>
                <span className="inline-flex items-center gap-1.5 text-on-surface-variant">
                  <MoonIcon className="h-3.5 w-3.5 text-secondary" />
                  {pkg.durationDays} nights duration
                </span>
              </div>
            </section>
          )}

          {/* Hotels */}
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>

          {/* Booking codes + seats */}
          <div className="mt-auto flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant/30 bg-surface-container-low px-4 py-2.5">
            <div className="flex items-center gap-2 text-xs">
              <TicketIcon className="h-4 w-4 shrink-0 text-secondary" />
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 leading-tight">
                {pkg.packageCode && (
                  <span className="text-on-surface-variant">
                    Package{" "}
                    <span className="font-semibold text-on-surface">{pkg.packageCode}</span>
                  </span>
                )}
                {pkg.groupCode && (
                  <span className="text-on-surface-variant">
                    Group <span className="font-semibold text-on-surface">{pkg.groupCode}</span>
                  </span>
                )}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5">
              <SeatIcon className="h-4 w-4 text-secondary" />
              <SeatBadge available={pkg.seatsAvailable} total={pkg.seatsTotal} />
            </span>
          </div>
        </div>

        {/* Price rail */}
        <div className="flex flex-col gap-3 lg:border-l lg:border-outline-variant/40 lg:pl-4">
          <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
            <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-on-surface-variant">
              Price per person (PKR)
            </p>
            <div>
              {tiers.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between border-b border-outline-variant/25 py-1.5 last:border-0"
                >
                  <span className="flex items-center gap-2">
                    {t.best && <StarIcon className="h-3.5 w-3.5 text-secondary" />}
                    <span
                      className={clsx(
                        "text-sm",
                        t.best ? "font-semibold text-on-surface" : "text-on-surface-variant",
                      )}
                    >
                      {t.label}
                    </span>
                    {t.best && (
                      <span className="rounded-full bg-secondary-container px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-on-secondary-container">
                        Best value
                      </span>
                    )}
                  </span>
                  <span
                    className={clsx(
                      "font-[var(--font-heading)] tabular-nums",
                      t.best ? "text-base text-secondary" : "text-sm text-on-surface",
                    )}
                  >
                    {formatPkr(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-auto flex items-end justify-between gap-3">
            <div>
              <p className="text-[0.7rem] uppercase tracking-wider text-on-surface-variant">
                From / person
              </p>
              <p className="font-[var(--font-heading)] text-xl text-on-surface">
                {formatPkr(pricing.sharing)}
              </p>
            </div>
            <a
              href={
                soldOut
                  ? site.whatsappHref
                  : `${site.whatsappHref}?text=${encodeURIComponent(`I'm interested in ${pkg.title} (${pkg.packageCode ?? pkg.id})`)}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className={clsx(
                "inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-xs font-semibold uppercase tracking-widest transition-all",
                soldOut
                  ? "border border-outline-variant text-on-surface-variant hover:bg-surface-container"
                  : "bg-secondary-fixed text-on-secondary-fixed hover:brightness-105",
              )}
            >
              {soldOut ? "Join Waitlist" : "Enquire"}
              <ArrowRightIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Included services (full-width footer) ---------------------------- */}
      <div className="border-t border-outline-variant/40 bg-surface-container-low/40 px-5 py-3">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2.5">
          <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-on-surface-variant">
            Included
          </span>
          {includedServices.map((svc) => {
            const Ic = SERVICE_ICONS[svc];
            return (
              <span key={svc} className="inline-flex items-center gap-2 text-sm text-on-surface">
                <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary-container/60 text-secondary">
                  {Ic && <Ic className="h-4 w-4" />}
                </span>
                {svc}
              </span>
            );
          })}
        </div>
      </div>
    </article>
  );
}

// --- Subcomponents ----------------------------------------------------------

function FlightLeg({
  Icon,
  flightNo,
  date,
  time,
  bigTime,
  bigLabel,
  alignEnd,
}: {
  Icon: SvgIcon;
  flightNo: string;
  date: string;
  time: string;
  bigTime: string;
  bigLabel: string;
  alignEnd?: boolean;
}) {
  return (
    <div className={clsx(alignEnd && "sm:text-right")}>
      <div className={clsx("flex items-center gap-2", alignEnd && "sm:flex-row-reverse")}>
        <Icon className="h-4 w-4 shrink-0 text-secondary" />
        <span className="text-sm font-semibold text-on-surface">{flightNo}</span>
      </div>
      <p className="mt-1 text-xs text-on-surface-variant">
        {formatDate(date)} · {time}
      </p>
      <p className="mt-2 font-[var(--font-heading)] text-base leading-none text-on-surface">
        {bigTime}
      </p>
      <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-wider text-secondary">
        {bigLabel}
      </p>
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
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-secondary">
          {label}
        </p>
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
