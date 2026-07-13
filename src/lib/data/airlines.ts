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

export interface AirlineRecord {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
}

/** Full airline records (id + logo) for the admin Airlines page. */
export async function getAllAirlines(): Promise<AirlineRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("airlines")
    .select("id, name, logo_url, is_active")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw error;
  return data.map((a) => ({ id: a.id, name: a.name, logoUrl: a.logo_url, isActive: a.is_active }));
}

/** Airline name → logo URL, for stamping logos onto package cards. */
export async function getAirlineLogoMap(): Promise<Record<string, string>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("airlines").select("name, logo_url");
  if (error) throw error;
  const map: Record<string, string> = {};
  for (const a of data) if (a.logo_url) map[a.name] = a.logo_url;
  return map;
}
