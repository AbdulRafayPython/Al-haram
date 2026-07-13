import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CityOption {
  code: string;
  name: string;
}

/** Active departure cities, ordered for the package filters and wizard dropdown. */
export async function getCities(): Promise<CityOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("code, name")
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data;
}

export interface CityRecord {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
}

/** Every city (including inactive), for the admin Cities page. */
export async function getAllCities(): Promise<CityRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cities")
    .select("id, code, name, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data.map((c) => ({ id: c.id, code: c.code, name: c.name, isActive: c.is_active }));
}
