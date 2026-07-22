import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";
import { getSerializedPackage } from "@/lib/api/packages";

export { OPTIONS };

/**
 * POST /api/packages/publish   (admin)
 * Body: { "id": "...", "isPublished": true|false }
 * Show or hide a package on the public site without touching anything else.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");
  if (typeof body.isPublished !== "boolean") {
    throw new ApiError(400, '"isPublished" must be true or false.');
  }

  const { error } = await supabase
    .from("packages")
    .update({ is_published: body.isPublished })
    .eq("id", id);
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/");
  return ok(await getSerializedPackage(supabase, id));
});
