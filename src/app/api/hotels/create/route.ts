import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson } from "@/lib/api/http";
import { hotelBodyToRow, serializeHotel } from "@/lib/api/hotels";
import type { TablesInsert } from "@/lib/supabase/types";

export { OPTIONS };

/**
 * POST /api/hotels/create   (admin)
 * Body: { name, city: "Makkah"|"Madinah", location, distance,
 *         rateSharing?, rateDouble, rateTriple, rateQuad }
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const row = hotelBodyToRow(body) as unknown as TablesInsert<"hotels">;

  const { data, error } = await supabase.from("hotels").insert(row).select("*").single();
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/saudi-hotels");
  return ok(serializeHotel(data), undefined, 201);
});
