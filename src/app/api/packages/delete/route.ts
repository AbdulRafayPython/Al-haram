import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/packages/delete   (admin)
 * Body: { "id": "..." }
 * Permanently removes a package.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");

  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/");
  return ok({ id, deleted: true });
});
