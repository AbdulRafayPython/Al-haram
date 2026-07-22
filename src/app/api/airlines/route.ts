import { anonClient, optionalAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";

export { OPTIONS };

/**
 * GET /api/airlines
 * Public. Full records (id, name, logo, active) ordered for pickers.
 */
export const GET = handle(async (req) => {
  const admin = await optionalAdmin(req);
  const supabase = admin?.supabase ?? anonClient();

  const { data, error } = await supabase
    .from("airlines")
    .select("id, name, logo_url, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new ApiError(500, error.message);

  const airlines = (data ?? []).map((a) => ({
    id: a.id,
    name: a.name,
    logoUrl: a.logo_url,
    isActive: a.is_active,
  }));
  return ok(airlines, { count: airlines.length });
});
