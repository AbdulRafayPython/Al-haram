import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Active airline names, ordered for the package wizard dropdown. */
export async function getAirlines(): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("airlines")
    .select("name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data.map((a) => a.name);
}
