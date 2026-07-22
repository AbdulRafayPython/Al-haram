import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/cities/create   (admin)
 * Body: { "name": "Karachi", "code": "KHI" }
 * Idempotent on code — re-adding an existing code returns the existing record.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const name = requireString(body, "name");
  const code = requireString(body, "code").toUpperCase();
  if (code.length > 4) throw new ApiError(400, "City code must be at most 4 characters.");

  const { error } = await supabase
    .from("cities")
    .upsert({ name, code, sort_order: 50 }, { onConflict: "code", ignoreDuplicates: true });
  if (error) throw new ApiError(400, error.message);

  const { data, error: readError } = await supabase
    .from("cities")
    .select("id, code, name, is_active")
    .eq("code", code)
    .single();
  if (readError) throw new ApiError(500, readError.message);

  revalidatePath("/");
  return ok(
    { id: data.id, code: data.code, name: data.name, isActive: data.is_active },
    undefined,
    201,
  );
});
