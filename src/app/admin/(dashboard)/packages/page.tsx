import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { formatDate, formatPkr } from "@/lib/format";
import { getAdminPackagesPage, ADMIN_PAGE_SIZE } from "@/lib/data/packages";
import { PackageRowActions } from "./PackageRowActions";

export const metadata: Metadata = {
  title: "Umrah Packages",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const pageParam = Number((await searchParams).page ?? "1");
  const { items: packages, total, page, pageCount } = await getAdminPackagesPage(pageParam);
  const firstShown = total === 0 ? 0 : (page - 1) * ADMIN_PAGE_SIZE + 1;
  const lastShown = Math.min(page * ADMIN_PAGE_SIZE, total);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Umrah Packages</h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {total === 0
              ? "No packages in the system."
              : `Showing ${firstShown}–${lastShown} of ${total} package${total === 1 ? "" : "s"}.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button href="/admin/packages/scrape" variant="secondary">
            <Icon name="travel_explore" className="text-base" /> Scrape from URL
          </Button>
          <Button href="/admin/packages/import" variant="secondary">
            <Icon name="data_object" className="text-base" /> Import JSON
          </Button>
          <Button href="/admin/packages/new" variant="gold">
            <Icon name="add" className="text-base" /> Add Package
          </Button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest">
        {packages.length === 0 ? (
          <div className="flex flex-col items-center p-14 text-center">
            <Icon name="flight_class" className="text-5xl text-on-surface-variant/70" />
            <p className="mt-4 font-[var(--font-heading)] text-lg text-on-surface">
              No packages yet
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Add your first Umrah departure to see it here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/40 bg-surface-container text-xs uppercase tracking-wider text-on-surface-variant">
                  <th className="px-5 py-3 font-semibold">Package</th>
                  <th className="px-5 py-3 font-semibold">Route</th>
                  <th className="px-5 py-3 font-semibold">Departure</th>
                  <th className="px-5 py-3 font-semibold">Room</th>
                  <th className="px-5 py-3 text-right font-semibold">From</th>
                  <th className="px-5 py-3 text-right font-semibold">Seats</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {packages.map((p) => (
                  <tr key={p.id} className="border-b border-outline-variant/30 last:border-0">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-on-surface">{p.title}</p>
                      <p className="text-xs text-on-surface-variant">{p.packageCode}</p>
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {p.departureCityCode} · {p.airline}
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {formatDate(p.departureDate)}
                    </td>
                    <td className="px-5 py-3.5 text-on-surface-variant">
                      {p.roomTypes.join(", ") || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right text-on-surface">
                      {formatPkr(p.pricePkr)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-on-surface-variant">
                      {p.seatsAvailable}/{p.seatsTotal}
                    </td>
                    <td className="px-5 py-3.5">
                      <PackageRowActions id={p.id} title={p.title} isPublished={p.isPublished} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <nav className="mt-5 flex items-center justify-between gap-3" aria-label="Pagination">
          <PagerLink href={`/admin/packages?page=${page - 1}`} disabled={page <= 1}>
            <Icon name="chevron_left" className="text-base" /> Previous
          </PagerLink>
          <p className="text-sm text-on-surface-variant">
            Page {page} of {pageCount}
          </p>
          <PagerLink href={`/admin/packages?page=${page + 1}`} disabled={page >= pageCount}>
            Next <Icon name="chevron_right" className="text-base" />
          </PagerLink>
        </nav>
      )}
    </div>
  );
}

function PagerLink({
  href,
  disabled,
  children,
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const base =
    "inline-flex items-center gap-1 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors";
  if (disabled) {
    return (
      <span className={`${base} pointer-events-none border-outline-variant/30 text-on-surface-variant/40`}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} className={`${base} border-outline-variant text-on-surface hover:border-secondary`}>
      {children}
    </Link>
  );
}
