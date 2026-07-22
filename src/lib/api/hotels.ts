/** Hotel serialization + write validation for the REST API (mirrors the admin panel rules). */
import type { Tables } from "@/lib/supabase/types";
import { ApiError } from "./http";

export function serializeHotel(h: Tables<"hotels">) {
  return {
    id: h.id,
    name: h.name,
    city: h.city,
    location: h.location,
    distance: h.distance,
    rates: {
      sharing: h.rate_sharing,
      double: h.rate_double,
      triple: h.rate_triple,
      quad: h.rate_quad,
    },
    hasImage: h.has_image || Boolean(h.image_url),
    imageUrl: h.image_url,
    createdAt: h.created_at,
  };
}

function num(body: Record<string, unknown>, key: string): number | null {
  const v = body[key];
  if (v === undefined || v === null || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) throw new ApiError(400, `"${key}" must be a number.`);
  return n;
}

/**
 * Validate an incoming hotel body and map it to a `hotels` row.
 * `partial` (for updates) only maps/validates the fields that are present.
 */
export function hotelBodyToRow(
  body: Record<string, unknown>,
  { partial = false }: { partial?: boolean } = {},
): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  const has = (k: string) => body[k] !== undefined;

  if (!partial || has("name")) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) throw new ApiError(400, "Hotel name is required.");
    row.name = name;
  }
  if (!partial || has("city")) {
    const city = typeof body.city === "string" ? body.city.trim() : "";
    if (city !== "Makkah" && city !== "Madinah") {
      throw new ApiError(400, '"city" must be "Makkah" or "Madinah".');
    }
    row.city = city;
  }
  if (!partial || has("location")) {
    const location = typeof body.location === "string" ? body.location.trim() : "";
    if (!location) throw new ApiError(400, "Location is required.");
    row.location = location;
  }
  if (!partial || has("distance")) {
    const distance = typeof body.distance === "string" ? body.distance.trim() : "";
    if (!distance) throw new ApiError(400, "Distance / shuttle info is required.");
    row.distance = distance;
  }
  if (!partial || has("rateSharing")) row.rate_sharing = num(body, "rateSharing");
  if (!partial || has("rateDouble")) row.rate_double = num(body, "rateDouble");
  if (!partial || has("rateTriple")) row.rate_triple = num(body, "rateTriple");
  if (!partial || has("rateQuad")) row.rate_quad = num(body, "rateQuad");

  // Double / triple / quad rates must be present and > 0 (they feed the /calculator).
  for (const [key, col] of [
    ["rateDouble", "rate_double"],
    ["rateTriple", "rate_triple"],
    ["rateQuad", "rate_quad"],
  ] as const) {
    if (col in row) {
      const v = row[col];
      if (typeof v !== "number" || v <= 0) {
        throw new ApiError(400, `"${key}" must be greater than zero.`);
      }
    }
  }

  return row;
}
