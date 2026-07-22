import { anonClient, optionalAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";

export { OPTIONS };

/**
 * GET /api/cities
 * Public. Departure cities (id, code, name, active) ordered for pickers.
 */
export const GET = handle(async (req) => {
  const admin = await optionalAdmin(req);
  const supabase = admin?.supabase ?? anonClient();

  const { data, error } = await supabase
    .from("cities")
    .select("id, code, name, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new ApiError(500, error.message);

  const cities = (data ?? []).map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    isActive: c.is_active,
  }));
  return ok(cities, { count: cities.length });
});
