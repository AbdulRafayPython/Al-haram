import type { Metadata } from "next";
import { getHotelOptions } from "@/lib/data/packages";
import { getAirlines } from "@/lib/data/airlines";
import { PackageWizard } from "../PackageWizard";

export const metadata: Metadata = {
  title: "Add Package",
  robots: { index: false, follow: false },
};

export default async function NewPackagePage() {
  const [hotelOptions, airlines] = await Promise.all([getHotelOptions(), getAirlines()]);

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Add Umrah Package</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Walk through each step to publish a new departure to the live board.
      </p>
      <div className="mt-6">
        <PackageWizard hotelOptions={hotelOptions} airlines={airlines} mode="create" />
      </div>
    </div>
  );
}
