import { Icon } from "@/components/ui/Icon";
import { SeatBadge } from "@/components/ui/SeatBadge";
import { clsx } from "@/lib/clsx";
import { formatPkr, formatDate } from "@/lib/format";
import { site } from "@/data/site";
import type { UmrahPackage } from "@/data/types";

export function PackageCard({ pkg }: { pkg: UmrahPackage }) {
  const soldOut = pkg.seatsAvailable === 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      {/* Header band */}
      <div className="relative flex items-center justify-between bg-primary px-6 py-5 text-on-primary">
        <div>
          <p className="text-xs uppercase tracking-widest text-secondary-fixed">
            {pkg.airline}
          </p>
          <h3 className="mt-1 font-[var(--font-heading)] text-xl text-on-primary">
            {pkg.departureCity}
          </h3>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-on-primary/10">
          <Icon name="flight_takeoff" className="text-2xl text-secondary-fixed" />
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between">
          <SeatBadge available={pkg.seatsAvailable} total={pkg.seatsTotal} />
          <span className="inline-flex items-center gap-1 text-sm text-on-surface-variant">
            <Icon name="calendar_month" className="text-base text-secondary" />
            {pkg.durationDays} days
          </span>
        </div>

        <dl className="space-y-2.5 text-sm">
          <Row icon="event" label="Departs" value={formatDate(pkg.departureDate)} />
          <Row icon="mosque" label="Makkah" value={pkg.makkahHotel} />
          <Row icon="local_hotel" label="Madinah" value={pkg.madinahHotel} />
          <Row icon="king_bed" label="Room" value={pkg.roomType} />
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-outline-variant/40 pt-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-on-surface-variant">
              From / person
            </p>
            <p className="font-[var(--font-heading)] text-2xl text-primary">
              {formatPkr(pkg.pricePkr)}
            </p>
          </div>
          <a
            href={soldOut ? site.whatsappHref : `${site.whatsappHref}?text=I'm interested in ${encodeURIComponent(pkg.title)}`}
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
            <Icon name="arrow_forward" className="text-base" />
          </a>
        </div>
      </div>
    </article>
  );
}

function Row({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} className="text-lg text-secondary" />
      <span className="w-16 shrink-0 text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}
