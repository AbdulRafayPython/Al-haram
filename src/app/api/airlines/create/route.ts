import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/airlines/create   (admin)
 * Body: { "name": "..." }
 * Idempotent — re-adding an existing airline returns the existing record.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const name = requireString(body, "name");

  const { error } = await supabase
    .from("airlines")
    .upsert({ name, sort_order: 50 }, { onConflict: "name", ignoreDuplicates: true });
  if (error) throw new ApiError(400, error.message);

  const { data, error: readError } = await supabase
    .from("airlines")
    .select("id, name, logo_url, is_active")
    .eq("name", name)
    .single();
  if (readError) throw new ApiError(500, readError.message);

  revalidatePath("/");
  return ok(
    { id: data.id, name: data.name, logoUrl: data.logo_url, isActive: data.is_active },
    undefined,
    201,
  );
});
