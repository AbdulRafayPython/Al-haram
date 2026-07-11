import type { Metadata } from "next";
import { getHotelOptions } from "@/lib/data/packages";
import { PackageWizard } from "../PackageWizard";

export const metadata: Metadata = {
  title: "Add Package",
  robots: { index: false, follow: false },
};

export default async function NewPackagePage() {
  const hotelOptions = await getHotelOptions();

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Add Umrah Package</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Walk through each step to publish a new departure to the live board.
      </p>
      <div className="mt-6">
        <PackageWizard hotelOptions={hotelOptions} mode="create" />
      </div>
    </div>
  );
}
