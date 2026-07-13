import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { getAllAirlines } from "@/lib/data/airlines";
import { AddAirlineForm } from "./AddAirlineForm";
import { AirlineLogoForm } from "./AirlineLogoForm";

export const metadata: Metadata = {
  title: "Airlines",
  robots: { index: false, follow: false },
};

// Always show the latest added airlines and uploaded logos.
export const dynamic = "force-dynamic";

export default async function AdminAirlinesPage() {
  const airlines = await getAllAirlines();

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Airlines</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Add airlines and upload their logos. Uploaded logos are converted to WebP automatically
        and shown on the package cards.
      </p>

      <div className="mt-6">
        <AddAirlineForm />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {airlines.length === 0 && (
          <p className="col-span-full rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">
            No airlines yet — add one above.
          </p>
        )}
        {airlines.map((a) => (
          <div
            key={a.id}
            className="flex flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-container">
                {a.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.logoUrl} alt={a.name} className="h-full w-full object-contain p-1.5" />
                ) : (
                  <Icon name="flight" className="text-2xl text-on-surface-variant/50" />
                )}
              </div>
              <h2 className="font-[var(--font-heading)] text-base text-on-surface">{a.name}</h2>
            </div>
            <AirlineLogoForm airlineId={a.id} hasLogo={Boolean(a.logoUrl)} />
          </div>
        ))}
      </div>
    </div>
  );
}
