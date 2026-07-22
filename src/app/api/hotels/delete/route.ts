import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/hotels/delete   (admin)
 * Body: { "id": "..." }
 * Blocked (409) if a package still references the hotel.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");

  const { error } = await supabase.from("hotels").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new ApiError(
        409,
        "This hotel is used by one or more packages. Reassign or delete those packages first.",
      );
    }
    throw new ApiError(400, error.message);
  }

  revalidatePath("/saudi-hotels");
  return ok({ id, deleted: true });
});
