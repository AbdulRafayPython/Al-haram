import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import type { RoomType, UmrahPackage } from "@/data/types";
import { getAirlineLogoMap } from "@/lib/data/airlines";

type JoinedHotel = Pick<Tables<"hotels">, "name" | "location">;

type PackageRow = Tables<"packages"> & {
  makkah_hotel: JoinedHotel | null;
  madinah_hotel: JoinedHotel | null;
};

// Only the hotel columns the cards actually read (name/location) — joining the
// full hotel row multiplied the payload several times over for no benefit.
const PACKAGE_SELECT =
  "*, makkah_hotel:hotels!packages_makkah_hotel_id_fkey(name, location), madinah_hotel:hotels!packages_madinah_hotel_id_fkey(name, location)";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function toUmrahPackage(row: PackageRow, logoMap: Record<string, string> = {}): UmrahPackage {
  return {
    id: row.id,
    title: row.title,
    airline: row.airline,
    airlineLogoUrl: logoMap[row.airline] ?? null,
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
    baggage: row.baggage,
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
          departureTime: row.flight_departure_time ?? "",
          arrivalTime: row.flight_arrival_time ?? "",
          departureDate: row.flight_departure_date ?? undefined,
          arrivalDate: row.flight_arrival_date ?? undefined,
        }
      : undefined,
    pricing: {
      sharing: row.price_sharing ?? row.price_pkr,
      quad: row.price_quad ?? row.price_pkr,
      triple: row.price_triple ?? row.price_pkr,
      double: row.price_double ?? row.price_pkr,
      infant: row.price_infant ?? 0,
      childNoBed: row.price_child_no_bed ?? 0,
    },
  };
}

/** Public board: only published departures, soonest first. */
export async function getPublishedPackages(): Promise<UmrahPackage[]> {
  const supabase = await createClient();
  const [{ data, error }, logoMap] = await Promise.all([
    supabase
      .from("packages")
      .select(PACKAGE_SELECT)
      .eq("is_published", true)
      .order("departure_date", { ascending: true }),
    getAirlineLogoMap(),
  ]);

  if (error) throw error;
  return (data as unknown as PackageRow[]).map((row) => toUmrahPackage(row, logoMap));
}

/**
 * The admin list/dashboard render a handful of scalar fields — no hotels, no
 * airline logos. Selecting only those (instead of `*` + two full hotel joins)
 * cuts the payload from ~544 KB to ~16 KB per page and the query from ~700 ms
 * to ~220 ms, which is the bulk of the admin's page-switch latency.
 */
const ADMIN_LIST_SELECT =
  "id, title, package_code, airline, departure_city_code, departure_date, room_types, room_type, price_pkr, seats_total, seats_available, is_published";

type AdminListRow = Pick<
  Tables<"packages">,
  | "id" | "title" | "package_code" | "airline" | "departure_city_code" | "departure_date"
  | "room_types" | "room_type" | "price_pkr" | "seats_total" | "seats_available" | "is_published"
>;

/** A row of the admin packages table — deliberately lean. */
export interface AdminPackageListItem {
  id: string;
  title: string;
  packageCode: string | null;
  airline: string;
  departureCityCode: string;
  departureDate: string;
  roomTypes: RoomType[];
  pricePkr: number;
  seatsTotal: number;
  seatsAvailable: number;
  isPublished: boolean;
}

function toListItem(row: AdminListRow): AdminPackageListItem {
  return {
    id: row.id,
    title: row.title,
    packageCode: row.package_code,
    airline: row.airline,
    departureCityCode: row.departure_city_code,
    departureDate: row.departure_date,
    roomTypes: (row.room_types?.length ? row.room_types : row.room_type ? [row.room_type] : []) as RoomType[],
    pricePkr: row.price_pkr,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    isPublished: row.is_published,
  };
}

export const ADMIN_PAGE_SIZE = 50;

export interface AdminPackagesPage {
  items: AdminPackageListItem[];
  total: number;
  page: number;
  pageCount: number;
}

/** Admin list: one page of packages, newest first. */
export async function getAdminPackagesPage(page = 1): Promise<AdminPackagesPage> {
  const supabase = await createClient();
  const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
  const from = (safePage - 1) * ADMIN_PAGE_SIZE;

  const { data, error, count } = await supabase
    .from("packages")
    .select(ADMIN_LIST_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + ADMIN_PAGE_SIZE - 1);

  if (error) throw error;
  const total = count ?? 0;
  return {
    items: (data as AdminListRow[]).map(toListItem),
    total,
    page: safePage,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
  };
}

export interface AdminDashboardData {
  total: number;
  seatsAvailable: number;
  soldOut: number;
  featured: number;
  recent: AdminPackageListItem[];
}

/**
 * Dashboard: two small parallel queries instead of pulling every package with
 * its hotel joins. The stats query fetches two numeric columns (~8 KB for the
 * whole table); "Recently added" fetches only the 6 rows it shows.
 */
export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = await createClient();
  const [stats, recent] = await Promise.all([
    supabase.from("packages").select("seats_available, featured"),
    supabase.from("packages").select(ADMIN_LIST_SELECT).order("created_at", { ascending: false }).limit(6),
  ]);
  if (stats.error) throw stats.error;
  if (recent.error) throw recent.error;

  const rows = stats.data ?? [];
  return {
    total: rows.length,
    seatsAvailable: rows.reduce((sum, r) => sum + (r.seats_available ?? 0), 0),
    soldOut: rows.filter((r) => r.seats_available === 0).length,
    featured: rows.filter((r) => r.featured).length,
    recent: (recent.data as AdminListRow[]).map(toListItem),
  };
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
