import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { getHotels } from "@/lib/data/hotels";
import { HotelImageForm } from "./HotelImageForm";

export const metadata: Metadata = {
  title: "Hotels",
  robots: { index: false, follow: false },
};

// Always show the latest uploaded images.
export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const hotels = await getHotels();

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Hotels</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Upload a photo for each hotel. Uploaded images replace the city placeholder on the public
        Hotels page. Rates and details stay managed via the database.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {hotels.map((hotel) => (
          <div
            key={hotel.id}
            className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-container-lowest"
          >
            <div className="relative aspect-video bg-surface-container">
              {hotel.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={hotel.imageUrl} alt={hotel.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-on-surface-variant/60">
                  <Icon name="image" className="text-3xl" />
                  <span className="text-xs">No image yet</span>
                </div>
              )}
              <span className="absolute left-2 top-2 rounded-full bg-primary/90 px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-on-primary">
                {hotel.city}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-4">
              <h2 className="font-[var(--font-heading)] text-base text-on-surface">{hotel.name}</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">{hotel.location}</p>
              <div className="mt-auto">
                <HotelImageForm hotelId={hotel.id} hasImage={Boolean(hotel.imageUrl)} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
