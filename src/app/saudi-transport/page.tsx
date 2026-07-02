import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { TransportTable } from "@/components/transport/TransportTable";
import { transportRates, transportStats } from "@/data/transport";
import { formatSar } from "@/lib/format";

export const metadata: Metadata = {
  title: "Saudi Transport Rates",
  description:
    "Airport transfers, hotel transfers, railway transfers, and ziyarat routes by vehicle type and SAR rate.",
};

const summary = [
  { icon: "route", value: transportStats.total, label: "Transport Rates" },
  { icon: "directions_car", value: transportStats.vehicleGroups, label: "Vehicle Groups" },
  { icon: "handshake", value: transportStats.partners, label: "Trusted Partner" },
  { icon: "payments", value: formatSar(transportStats.lowest), label: "Lowest Rate" },
];

export default function SaudiTransportPage() {
  return (
    <>
      <PageHeader
        eyebrow="Ground Logistics"
        title="Umrah Transport Rates"
        description="Airport and hotel transfers, Haramain railway connections, and ziyarat routes — select a vehicle to see live pricing."
        icon="airport_shuttle"
        image="/images/transport.jpg"
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
          <TransportTable rates={transportRates} />
        </Container>
      </section>
    </>
  );
}
