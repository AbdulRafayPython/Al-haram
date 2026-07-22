import { anonClient, optionalAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";
import { serializeHotel } from "@/lib/api/hotels";

export { OPTIONS };

/**
 * GET /api/hotels
 * Query: city = "Makkah" | "Madinah" (optional).
 * Public. Includes per-night SAR rates (used by the price calculator).
 */
export const GET = handle(async (req) => {
  const admin = await optionalAdmin(req);
  const supabase = admin?.supabase ?? anonClient();

  let query = supabase.from("hotels").select("*").order("city").order("name");
  const city = req.nextUrl.searchParams.get("city");
  if (city) query = query.eq("city", city);

  const { data, error } = await query;
  if (error) throw new ApiError(500, error.message);
  return ok((data ?? []).map(serializeHotel), { count: data?.length ?? 0 });
});
