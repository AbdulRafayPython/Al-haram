import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";
import { hotelBodyToRow, serializeHotel } from "@/lib/api/hotels";
import type { TablesUpdate } from "@/lib/supabase/types";

export { OPTIONS };

/**
 * POST /api/hotels/update   (admin)
 * Body: { "id": "...", ...fields } — partial; send only what changes.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");
  const row = hotelBodyToRow(body, { partial: true });
  if (Object.keys(row).length === 0) throw new ApiError(400, "No fields to update.");

  const { data, error } = await supabase
    .from("hotels")
    .update(row as unknown as TablesUpdate<"hotels">)
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (error) throw new ApiError(400, error.message);
  if (!data) throw new ApiError(404, "Hotel not found.");

  revalidatePath("/saudi-hotels");
  return ok(serializeHotel(data));
});
