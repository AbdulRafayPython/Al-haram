/**
 * Package serialization + editing for the REST API.
 *
 * - `serializePackageRow` shapes a DB row (with hotels joined) into the JSON the
 *   app receives from GET /api/packages.
 * - `buildImportContext` loads the real cities/airlines/hotels the create/update
 *   validators resolve names against.
 * - `packageRowToImportObject` + `mergePackagePatch` power partial updates: we
 *   rebuild the existing package as import-JSON, merge the caller's patch on top,
 *   then run the SAME validator the admin panel uses (`parseAndValidatePackageJson`)
 *   — so a phone edit is validated identically and can never drift.
 */
import type { Tables } from "@/lib/supabase/types";
import type { ImportContext } from "@/lib/importPackage";
import type { ApiSupabase } from "./auth";
import { ApiError } from "./http";

export const PACKAGE_SELECT =
  "*, makkah_hotel:hotels!packages_makkah_hotel_id_fkey(*), madinah_hotel:hotels!packages_madinah_hotel_id_fkey(*)";

export type PackageRowWithHotels = Tables<"packages"> & {
  makkah_hotel: Tables<"hotels"> | null;
  madinah_hotel: Tables<"hotels"> | null;
};

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function hotelSummary(h: Tables<"hotels"> | null) {
  if (!h) return null;
  return { id: h.id, name: h.name, city: h.city, location: h.location, distance: h.distance };
}

/** The JSON an app receives for a single package. Round-trips through the update endpoint. */
export function serializePackageRow(
  row: PackageRowWithHotels,
  logoMap: Record<string, string> = {},
) {
  return {
    id: row.id,
    title: row.title,
    airline: row.airline,
    airlineLogoUrl: logoMap[row.airline] ?? null,
    departureCity: row.departure_city,
    departureCityCode: row.departure_city_code,
    durationDays: row.duration_days,
    departureDate: row.departure_date,
    returnDate: addDays(row.departure_date, row.duration_days),
    makkahHotel: hotelSummary(row.makkah_hotel),
    madinahHotel: hotelSummary(row.madinah_hotel),
    makkahNights: row.makkah_nights,
    madinahNights: row.madinah_nights,
    roomTypes: row.room_types ?? [],
    prices: {
      sharing: row.price_sharing,
      quad: row.price_quad,
      triple: row.price_triple,
      double: row.price_double,
      infant: row.price_infant,
      childNoBed: row.price_child_no_bed,
    },
    pricePkr: row.price_pkr,
    baggage: row.baggage,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    flight: row.flight_route
      ? {
          route: row.flight_route,
          outboundNo: row.flight_outbound_no,
          inboundNo: row.flight_inbound_no,
          departureTime: row.flight_departure_time,
          arrivalTime: row.flight_arrival_time,
          departureDate: row.flight_departure_date,
          arrivalDate: row.flight_arrival_date,
        }
      : null,
    packageCode: row.package_code,
    groupCode: row.group_code,
    featured: row.featured,
    isPublished: row.is_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Load the cities/airlines/hotels the validator resolves names against. Unlike
 * the admin panel (active-only), the API matches against ALL defined records so
 * that editing a package whose airline/city was later deactivated still works.
 */
export async function buildImportContext(supabase: ApiSupabase): Promise<ImportContext> {
  const [cities, airlines, hotels] = await Promise.all([
    supabase.from("cities").select("code, name"),
    supabase.from("airlines").select("name"),
    supabase.from("hotels").select("id, name, city"),
  ]);
  if (cities.error) throw new ApiError(500, cities.error.message);
  if (airlines.error) throw new ApiError(500, airlines.error.message);
  if (hotels.error) throw new ApiError(500, hotels.error.message);
  return {
    cities: cities.data ?? [],
    airlines: (airlines.data ?? []).map((a) => a.name),
    hotels: hotels.data ?? [],
  };
}

/** Drop `undefined`/`null` so a rebuilt package matches the optional-field import shape. */
function compact(obj: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) if (v !== undefined && v !== null) out[k] = v;
  return out;
}

/**
 * Rebuild an existing package as the import-JSON shape (hotels by NAME, prices
 * nested) so a partial patch can be merged over it and re-validated as a whole.
 */
export function packageRowToImportObject(row: PackageRowWithHotels): Record<string, unknown> {
  return compact({
    title: row.title,
    departureCity: row.departure_city,
    departureCityCode: row.departure_city_code,
    airline: row.airline,
    departureDate: row.departure_date,
    durationDays: row.duration_days,
    makkahHotel: row.makkah_hotel?.name,
    madinahHotel: row.madinah_hotel?.name,
    makkahNights: row.makkah_nights,
    madinahNights: row.madinah_nights,
    roomTypes: row.room_types,
    prices: compact({
      sharing: row.price_sharing,
      quad: row.price_quad,
      triple: row.price_triple,
      double: row.price_double,
      infant: row.price_infant,
      childNoBed: row.price_child_no_bed,
    }),
    baggage: row.baggage,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    flight: row.flight_route
      ? compact({
          route: row.flight_route,
          outboundNo: row.flight_outbound_no,
          inboundNo: row.flight_inbound_no,
          departureTime: row.flight_departure_time,
          arrivalTime: row.flight_arrival_time,
          departureDate: row.flight_departure_date,
          arrivalDate: row.flight_arrival_date,
        })
      : undefined,
    packageCode: row.package_code,
    groupCode: row.group_code,
    featured: row.featured,
  });
}

/** Airline name -> uploaded logo URL, for stamping onto serialized packages. */
export async function loadLogoMap(supabase: ApiSupabase): Promise<Record<string, string>> {
  const { data } = await supabase.from("airlines").select("name, logo_url");
  const map: Record<string, string> = {};
  for (const a of data ?? []) if (a.logo_url) map[a.name] = a.logo_url;
  return map;
}

/** Re-fetch a package (with hotels + logo) and serialize it — used after writes. */
export async function getSerializedPackage(supabase: ApiSupabase, id: string) {
  const [{ data, error }, logos] = await Promise.all([
    supabase.from("packages").select(PACKAGE_SELECT).eq("id", id).single(),
    loadLogoMap(supabase),
  ]);
  if (error) throw new ApiError(500, error.message);
  return serializePackageRow(data as unknown as PackageRowWithHotels, logos);
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Merge a caller's patch onto the rebuilt package. `prices` and `flight` are
 * merged one level deep so a patch like `{ prices: { quad: 290000 } }` keeps the
 * other tiers; every other key replaces. Send `flight: null` to remove a flight.
 */
export function mergePackagePatch(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    if ((key === "prices" || key === "flight") && isPlainObject(value) && isPlainObject(base[key])) {
      merged[key] = { ...(base[key] as Record<string, unknown>), ...value };
    } else {
      merged[key] = value;
    }
  }
  return merged;
}
