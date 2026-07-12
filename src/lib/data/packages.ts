import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import type { RoomType, UmrahPackage } from "@/data/types";

type PackageRow = Tables<"packages"> & {
  makkah_hotel: Tables<"hotels"> | null;
  madinah_hotel: Tables<"hotels"> | null;
};

const PACKAGE_SELECT =
  "*, makkah_hotel:hotels!packages_makkah_hotel_id_fkey(*), madinah_hotel:hotels!packages_madinah_hotel_id_fkey(*)";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toUmrahPackage(row: PackageRow): UmrahPackage {
  return {
    id: row.id,
    title: row.title,
    airline: row.airline,
    departureCity: row.departure_city,
    departureCityCode: row.departure_city_code,
    durationDays: row.duration_days,
    departureDate: row.departure_date,
    makkahHotel: row.makkah_hotel?.name ?? "To be confirmed",
    madinahHotel: row.madinah_hotel?.name ?? "To be confirmed",
    roomTypes: (row.room_types?.length
      ? row.room_types
      : row.room_type
        ? [row.room_type]
        : []) as RoomType[],
    pricePkr: row.price_pkr,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    featured: row.featured,
    returnDate: addDays(row.departure_date, row.duration_days),
    makkahNights: row.makkah_nights,
    madinahNights: row.madinah_nights,
    makkahLocation: row.makkah_hotel?.location,
    madinahLocation: row.madinah_hotel?.location,
    packageCode: row.package_code ?? undefined,
    groupCode: row.group_code ?? undefined,
    flight: row.flight_route
      ? {
          route: row.flight_route,
          outboundNo: row.flight_outbound_no ?? "",
          inboundNo: row.flight_inbound_no ?? "",
          outboundTime: row.flight_outbound_time ?? "",
          inboundTime: row.flight_inbound_time ?? "",
          departureTime: row.flight_departure_time ?? "",
          arrivalTime: row.flight_arrival_time ?? "",
        }
      : undefined,
    pricing: {
      sharing: row.price_sharing ?? row.price_pkr,
      quad: row.price_quad ?? row.price_pkr,
      triple: row.price_triple ?? row.price_pkr,
      double: row.price_double ?? row.price_pkr,
      infant: row.price_infant ?? 0,
    },
  };
}

/** Public board: only published departures, soonest first. */
export async function getPublishedPackages(): Promise<UmrahPackage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(PACKAGE_SELECT)
    .eq("is_published", true)
    .order("departure_date", { ascending: true });

  if (error) throw error;
  return (data as unknown as PackageRow[]).map(toUmrahPackage);
}

export interface AdminPackage extends UmrahPackage {
  isPublished: boolean;
}

/** Admin list: every package regardless of publish state, newest first. */
export async function getAllPackagesForAdmin(): Promise<AdminPackage[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .select(PACKAGE_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as unknown as PackageRow[]).map((row) => ({
    ...toUmrahPackage(row),
    isPublished: row.is_published,
  }));
}

export async function getPackageRowById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.from("packages").select("*").eq("id", id).single();
  if (error) throw error;
  return data;
}

export interface PackageStats {
  departures: number;
  seatsAvailable: number;
  soldOut: number;
  hotelVariants: number;
}

export function getPackageStats(packages: UmrahPackage[]): PackageStats {
  const hotels = new Set<string>();
  packages.forEach((p) => {
    hotels.add(p.makkahHotel);
    hotels.add(p.madinahHotel);
  });
  return {
    departures: packages.length,
    seatsAvailable: packages.reduce((sum, p) => sum + p.seatsAvailable, 0),
    soldOut: packages.filter((p) => p.seatsAvailable === 0).length,
    hotelVariants: hotels.size,
  };
}

export interface CityBreakdownRow {
  city: string;
  total: number;
  sold: number;
  available: number;
}

export function getCityBreakdown(packages: UmrahPackage[]): CityBreakdownRow[] {
  const map = new Map<string, CityBreakdownRow>();
  for (const p of packages) {
    const row = map.get(p.departureCity) ?? {
      city: p.departureCity,
      total: 0,
      sold: 0,
      available: 0,
    };
    row.total += p.seatsTotal;
    row.available += p.seatsAvailable;
    row.sold += p.seatsTotal - p.seatsAvailable;
    map.set(p.departureCity, row);
  }
  return Array.from(map.values()).sort((a, b) => b.total - a.total);
}

export interface HotelOption {
  id: string;
  name: string;
  city: string;
  location: string;
}

export async function getHotelOptions(): Promise<HotelOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("id, name, city, location")
    .order("city")
    .order("name");
  if (error) throw error;
  return data;
}
