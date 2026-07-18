import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { HotelGallery } from "@/components/hotels/HotelGallery";
import { getHotels, getHotelStats } from "@/lib/data/hotels";

export const metadata: Metadata = {
  title: "Makkah & Madinah Hotels",
  description:
    "Browse Saudi hotels in Makkah and Madinah by distance from the Haram and location.",
};

export default async function SaudiHotelsPage() {
  const hotels = await getHotels();
  const hotelStats = getHotelStats(hotels);

  const summary = [
    { icon: "apartment", value: hotelStats.total, label: "Total Hotels" },
    { icon: "mosque", value: hotelStats.makkah, label: "Makkah Hotels" },
    { icon: "local_hotel", value: hotelStats.madinah, label: "Madinah Hotels" },
    { icon: "photo_library", value: hotelStats.withImages, label: "With Photos" },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Hotel Directory"
        title="Makkah & Madinah Hotels"
        description="Compare hotels near the Haramain by distance from the Haram and location."
        icon="hotel"
        image="/images/makkah-skyline.jpg"
      />

      <section className="border-b border-outline-variant/40 bg-surface-container-low py-10">
        <Container>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {summary.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-5"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container">
                  <Icon name={s.icon} className="text-2xl text-secondary" />
                </div>
                <div>
                  <p className="font-[var(--font-heading)] text-2xl text-on-surface">{s.value}</p>
                  <p className="text-xs uppercase tracking-wider text-on-surface-variant">
                    {s.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-14 md:py-20">
        <Container>
          <HotelGallery hotels={hotels} />
        </Container>
      </section>
    </>
  );
}
