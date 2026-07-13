import type { Metadata } from "next";
import { getAllCities } from "@/lib/data/cities";
import { CitiesAdmin } from "./CitiesAdmin";

export const metadata: Metadata = {
  title: "Cities",
  robots: { index: false, follow: false },
};

// Always show the latest added/edited cities.
export const dynamic = "force-dynamic";

export default async function AdminCitiesPage() {
  const cities = await getAllCities();

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Cities</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Add, rename, or remove departure cities available when building an Umrah package.
      </p>

      <div className="mt-6 max-w-2xl">
        <CitiesAdmin cities={cities} />
      </div>
    </div>
  );
}
