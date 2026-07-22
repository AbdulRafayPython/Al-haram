import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/cities/update   (admin)
 * Body: { "id": "...", "name": "...", "code": "..." }
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");
  const name = requireString(body, "name");
  const code = requireString(body, "code").toUpperCase();
  if (code.length > 4) throw new ApiError(400, "City code must be at most 4 characters.");

  const { data, error } = await supabase
    .from("cities")
    .update({ name, code })
    .eq("id", id)
    .select("id, code, name, is_active")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "That city code is already used by another city.");
    }
    throw new ApiError(400, error.message);
  }
  if (!data) throw new ApiError(404, "City not found.");

  revalidatePath("/");
  return ok({ id: data.id, code: data.code, name: data.name, isActive: data.is_active });
});
