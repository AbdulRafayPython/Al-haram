import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/cities/delete   (admin)
 * Body: { "id": "..." }
 * Cities are free text on packages, so this only removes the city from future
 * pickers — it never affects existing packages.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");

  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/");
  return ok({ id, deleted: true });
});
