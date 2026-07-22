/**
 * Shared package mapping + validation: turns a validated `PackageFormInput`
 * into a `packages` table row, and enforces the blocking rules.
 *
 * Extracted from `app/admin/actions.ts` so both the admin Server Actions and
 * the mobile REST API (`app/api/packages/**`) use the exact same logic — they
 * can never drift. `actions.ts` is a `"use server"` module (only async Server
 * Actions may be exported from it), so these plain helpers have to live here.
 */
import { getBlockingFlightIssues } from "@/lib/flight";

export interface PackageFormInput {
  title: string;
  airline: string;
  departureCity: string;
  departureCityCode: string;
  durationDays: number;
  departureDate: string;
  makkahHotelId: string | null;
  madinahHotelId: string | null;
  makkahNights: number;
  madinahNights: number;
  roomTypes: string[];
  priceSharing: number;
  priceQuad: number | null;
  priceTriple: number | null;
  priceDouble: number | null;
  priceInfant: number | null;
  priceChildNoBed: number | null;
  seatsTotal: number;
  seatsAvailable: number;
  packageCode: string | null;
  groupCode: string | null;
  flightRoute: string | null;
  flightOutboundNo: string | null;
  flightInboundNo: string | null;
  flightDepartureTime: string | null;
  flightArrivalTime: string | null;
  flightDepartureDate: string | null;
  flightArrivalDate: string | null;
  baggage: string | null;
  featured: boolean;
}

export function packageInputToRow(input: PackageFormInput) {
  // Only persist prices for the room types this package actually offers.
  const offered = new Set(input.roomTypes);
  const priceSharing = offered.has("Sharing") ? input.priceSharing : null;
  const priceQuad = offered.has("Quad") ? input.priceQuad : null;
  const priceTriple = offered.has("Triple") ? input.priceTriple : null;
  const priceDouble = offered.has("Double") ? input.priceDouble : null;

  // "From" price = cheapest offered tier (used for sort/numbering + card headline).
  const offeredPrices = [priceSharing, priceQuad, priceTriple, priceDouble].filter(
    (p): p is number => p != null && p > 0,
  );
  const fromPrice = offeredPrices.length ? Math.min(...offeredPrices) : input.priceSharing;

  return {
    title: input.title,
    airline: input.airline,
    departure_city: input.departureCity,
    departure_city_code: input.departureCityCode,
    duration_days: input.durationDays,
    departure_date: input.departureDate,
    makkah_hotel_id: input.makkahHotelId,
    madinah_hotel_id: input.madinahHotelId,
    makkah_nights: input.makkahNights,
    madinah_nights: input.madinahNights,
    room_types: input.roomTypes,
    room_type: input.roomTypes[0] ?? null, // legacy single column
    price_sharing: priceSharing,
    price_quad: priceQuad,
    price_triple: priceTriple,
    price_double: priceDouble,
    price_infant: input.priceInfant,
    price_child_no_bed: input.priceChildNoBed,
    price_pkr: fromPrice,
    seats_total: input.seatsTotal,
    seats_available: input.seatsAvailable,
    package_code: input.packageCode,
    group_code: input.groupCode,
    flight_route: input.flightRoute,
    flight_outbound_no: input.flightOutboundNo,
    flight_inbound_no: input.flightInboundNo,
    flight_departure_time: input.flightDepartureTime,
    flight_arrival_time: input.flightArrivalTime,
    flight_departure_date: input.flightDepartureDate,
    flight_arrival_date: input.flightArrivalDate,
    baggage: input.baggage?.trim() ? input.baggage.trim() : null,
    featured: input.featured,
  };
}

/** Server-side safety net mirroring the wizard's blocking flight rules. */
export function assertPackageValid(input: PackageFormInput) {
  if (input.roomTypes.length === 0) {
    throw new Error("Select at least one room type.");
  }
  const blocking = getBlockingFlightIssues({
    outboundNo: input.flightOutboundNo,
    inboundNo: input.flightInboundNo,
    departureTime: input.flightDepartureTime,
    arrivalTime: input.flightArrivalTime,
  });
  if (blocking.length > 0) {
    throw new Error(blocking[0].message);
  }
}
