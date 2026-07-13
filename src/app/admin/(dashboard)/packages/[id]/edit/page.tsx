import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getHotelOptions, getPackageRowById } from "@/lib/data/packages";
import { getAirlines } from "@/lib/data/airlines";
import { getCities } from "@/lib/data/cities";
import { toTimeInputValue } from "@/lib/flight";
import { PackageWizard } from "../../PackageWizard";
import type { PackageFormInput } from "@/app/admin/actions";

export const metadata: Metadata = {
  title: "Edit Package",
  robots: { index: false, follow: false },
};

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [hotelOptions, airlines, cities, row] = await Promise.all([
    getHotelOptions(),
    getAirlines(),
    getCities(),
    getPackageRowById(id).catch(() => null),
  ]);

  if (!row) notFound();

  const roomTypes = row.room_types?.length
    ? row.room_types
    : row.room_type
      ? [row.room_type]
      : [];

  const initialValues: PackageFormInput = {
    title: row.title,
    airline: row.airline,
    departureCity: row.departure_city,
    departureCityCode: row.departure_city_code,
    durationDays: row.duration_days,
    departureDate: row.departure_date,
    makkahHotelId: row.makkah_hotel_id,
    madinahHotelId: row.madinah_hotel_id,
    makkahNights: row.makkah_nights,
    madinahNights: row.madinah_nights,
    roomTypes,
    priceSharing: row.price_sharing ?? row.price_pkr,
    priceQuad: row.price_quad,
    priceTriple: row.price_triple,
    priceDouble: row.price_double,
    priceInfant: row.price_infant,
    priceChildNoBed: row.price_child_no_bed,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    packageCode: row.package_code,
    groupCode: row.group_code,
    flightRoute: row.flight_route,
    flightOutboundNo: row.flight_outbound_no,
    flightInboundNo: row.flight_inbound_no,
    // Legacy free-text times are normalized to "HH:MM" so the time pickers show them.
    flightDepartureTime: toTimeInputValue(row.flight_departure_time) || null,
    flightArrivalTime: toTimeInputValue(row.flight_arrival_time) || null,
    flightDepartureDate: row.flight_departure_date,
    flightArrivalDate: row.flight_arrival_date,
    featured: row.featured,
  };

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Edit Package</h1>
      <p className="mt-1 text-sm text-on-surface-variant">{row.title}</p>
      <div className="mt-6">
        <PackageWizard
          hotelOptions={hotelOptions}
          airlines={airlines}
          cities={cities}
          mode="edit"
          packageId={id}
          initialValues={initialValues}
        />
      </div>
    </div>
  );
}
