import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { formatNumber, formatDate } from "@/lib/format";
import { getAllPackagesForAdmin } from "@/lib/data/packages";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const packages = await getAllPackagesForAdmin();
  const seatsAvailable = packages.reduce((sum, p) => sum + p.seatsAvailable, 0);
  const soldOut = packages.filter((p) => p.seatsAvailable === 0).length;

  const summary = [
    { icon: "flight_class", value: formatNumber(packages.length), label: "Total Packages" },
    { icon: "event_seat", value: formatNumber(seatsAvailable), label: "Available Seats" },
    { icon: "do_not_disturb_on", value: formatNumber(soldOut), label: "Sold Out" },
    { icon: "star", value: formatNumber(packages.filter((p) => p.featured).length), label: "Featured" },
  ];

  const recent = packages.slice(0, 6);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Dashboard</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Overview of your Umrah package inventory.
          </p>
        </div>
        <Button href="/admin/packages/new" variant="gold">
          <Icon name="add" className="text-base" /> Add Package
        </Button>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summary.map((s) => (
          <div
            key={s.label}
            className="flex items-center gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary-container">
              <Icon name={s.icon} className="text-xl text-secondary" />
            </div>
            <div>
              <p className="font-[var(--font-heading)] text-xl text-on-surface">{s.value}</p>
              <p className="text-xs uppercase tracking-wider text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        <div className="flex items-center justify-between border-b border-outline-variant/40 px-5 py-4">
          <h2 className="font-[var(--font-heading)] text-lg text-on-surface">Recently Added</h2>
          <Link href="/admin/packages" className="text-sm font-semibold text-secondary hover:underline">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="p-8 text-center text-sm text-on-surface-variant">
            No packages yet — add your first departure to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">Route</th>
                  <th className="px-5 py-3 font-semibold">Departure</th>
                  <th className="px-5 py-3 text-right font-semibold">Seats</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {recent.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant/30 last:border-0">
                    <td className="px-5 py-3.5 font-medium text-on-surface">{p.title}</td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {p.departureCityCode} · {p.airline}
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {formatDate(p.departureDate)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-on-surface-variant">
                      {p.seatsAvailable}/{p.seatsTotal}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/packages/${p.id}/edit`}
                        className="font-semibold text-secondary hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
