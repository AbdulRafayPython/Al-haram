import { anonClient, optionalAdmin, requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";
import {
  loadLogoMap,
  PACKAGE_SELECT,
  serializePackageRow,
  type PackageRowWithHotels,
} from "@/lib/api/packages";

export { OPTIONS };

/**
 * GET /api/packages
 * Query params:
 *   status   = "published" (default, public) | "all" | "unpublished" (admin token required)
 *   city     = departure city code, e.g. KHI
 *   airline  = exact airline name
 *   featured = "true" to only return featured packages
 */
export const GET = handle(async (req) => {
  const params = req.nextUrl.searchParams;
  const status = (params.get("status") ?? "published").toLowerCase();
  const wantHidden = status === "all" || status === "unpublished";

  // Listing hidden/unpublished packages requires an admin token.
  const admin = wantHidden ? await requireAdmin(req) : await optionalAdmin(req);
  const supabase = admin?.supabase ?? anonClient();

  let query = supabase.from("packages").select(PACKAGE_SELECT);
  if (status === "published") query = query.eq("is_published", true);
  else if (status === "unpublished") query = query.eq("is_published", false);
  // status === "all" -> no publish filter (admin only)

  const city = params.get("city");
  if (city) query = query.eq("departure_city_code", city.toUpperCase());
  const airline = params.get("airline");
  if (airline) query = query.eq("airline", airline);
  if (params.get("featured") === "true") query = query.eq("featured", true);

  query = wantHidden
    ? query.order("created_at", { ascending: false })
    : query.order("departure_date", { ascending: true });

  const [{ data, error }, logos] = await Promise.all([query, loadLogoMap(supabase)]);
  if (error) throw new ApiError(500, error.message);

  const rows = (data ?? []) as unknown as PackageRowWithHotels[];
  return ok(
    rows.map((row) => serializePackageRow(row, logos)),
    { count: rows.length },
  );
});
