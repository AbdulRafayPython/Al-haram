import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { PackageBoard } from "@/components/packages/PackageBoard";
import { getPublishedPackages, getPackageStats, getCityBreakdown } from "@/lib/data/packages";
import { formatNumber } from "@/lib/format";

export const metadata: Metadata = {
  title: "Live Umrah Packages",
  description:
    "Browse live Umrah package availability from Karachi, Islamabad, Lahore, Multan, and Peshawar with airlines, hotels, seats, and rates.",
};

// Seat counts change whenever the admin adds or edits a departure, so this
// page always reflects the database rather than a build-time snapshot.
export const dynamic = "force-dynamic";

export default async function UmrahPackagesPage() {
  const packages = await getPublishedPackages();
  const packageStats = getPackageStats(packages);
  const cityBreakdown = getCityBreakdown(packages);

  const summary = [
    { icon: "flight_takeoff", value: formatNumber(packageStats.departures), label: "Total Departures" },
    { icon: "event_seat", value: formatNumber(packageStats.seatsAvailable), label: "Available Seats" },
    { icon: "do_not_disturb_on", value: formatNumber(packageStats.soldOut), label: "Sold Out" },
    { icon: "hotel", value: formatNumber(packageStats.hotelVariants), label: "Hotel Variants" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Live Availability"
        title="Umrah Packages from Pakistan"
        description="Real-time departures with airline, hotel, room type, and seat status. Filter to find the journey that fits you."
        image="/images/umrah-package.png"
        imageVariant="night"
        imagePosition="object-[72%_30%] md:object-[center_28%]"
        align="left"
        compact
      />

      {/* Board */}
      <section className="py-6 md:py-8">
        <Container>
          <PackageBoard packages={packages} />
        </Container>
      </section>

      {/* Summary stats */}
      <section className="border-y border-outline-variant/40 bg-surface-container-low py-4">
        <Container>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {summary.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-3 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary-container">
                  <Icon name={s.icon} className="text-xl text-secondary" />
                </div>
                <div>
                  <p className="font-[var(--font-heading)] text-xl text-on-surface">{s.value}</p>
                  <p className="text-[0.65rem] uppercase tracking-wider text-on-surface-variant">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* City breakdown */}
      <section className="bg-surface-container-low py-14 md:py-20">
        <Container>
          <h2 className="font-[var(--font-heading)] text-2xl text-on-surface md:text-3xl">
            Availability by Departure City
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            A live overview of capacity across all sectors.
          </p>
          <div className="mt-8 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 font-semibold">City</th>
                  <th className="px-6 py-4 text-right font-semibold">Total</th>
                  <th className="px-6 py-4 text-right font-semibold">Sold</th>
                  <th className="px-6 py-4 text-right font-semibold">Available</th>
                  <th className="px-6 py-4 font-semibold">Capacity</th>
                </tr>
              </thead>
              <tbody>
                {cityBreakdown.map((row) => {
                  const pct = Math.round((row.available / row.total) * 100);
                  return (
                    <tr
                      key={row.city}
                      className="border-b border-outline-variant/30 last:border-0"
                    >
                      <td className="px-6 py-4 font-medium text-on-surface">{row.city}</td>
                      <td className="px-6 py-4 text-right text-on-surface-variant">
                        {formatNumber(row.total)}
                      </td>
                      <td className="px-6 py-4 text-right text-on-surface-variant">
                        {formatNumber(row.sold)}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-success">
                        {formatNumber(row.available)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-full max-w-32 overflow-hidden rounded-full bg-surface-container">
                            <div
                              className="h-full rounded-full bg-secondary"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="w-9 text-xs text-on-surface-variant">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Container>
      </section>
    </>
  );
}
