import type { Metadata } from "next";
import { getHotels } from "@/lib/data/hotels";
import { HotelsAdmin } from "./HotelsAdmin";

export const metadata: Metadata = {
  title: "Hotels",
  robots: { index: false, follow: false },
};

// Always show the latest hotels, rates, and uploaded images.
export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const hotels = await getHotels();

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Hotels</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Add, edit, and manage hotels — name, city, location, rates, and photos. These are the
        hotels available to pick from when building an Umrah package.
      </p>

      <div className="mt-6">
        <HotelsAdmin hotels={hotels} />
      </div>
    </div>
  );
}
