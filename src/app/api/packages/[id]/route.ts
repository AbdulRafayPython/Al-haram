import { anonClient, optionalAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";
import {
  loadLogoMap,
  PACKAGE_SELECT,
  serializePackageRow,
  type PackageRowWithHotels,
} from "@/lib/api/packages";

export { OPTIONS };

/**
 * GET /api/packages/:id
 * Public for published packages; an admin token also returns unpublished ones.
 */
export const GET = handle(async (req, ctx: { params: Promise<{ id: string }> }) => {
  const { id } = await ctx.params;
  const admin = await optionalAdmin(req);
  const supabase = admin?.supabase ?? anonClient();

  const { data, error } = await supabase
    .from("packages")
    .select(PACKAGE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new ApiError(500, error.message);
  const row = data as unknown as PackageRowWithHotels | null;
  // Public callers only see published packages (RLS also enforces this).
  if (!row || (!admin && !row.is_published)) {
    throw new ApiError(404, "Package not found.");
  }

  const logos = await loadLogoMap(supabase);
  return ok(serializePackageRow(row, logos));
});
