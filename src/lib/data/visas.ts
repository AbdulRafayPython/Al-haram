import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Visa } from "@/data/types";

export async function getVisas(): Promise<Visa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("visas").select("*").order("validity_days");
  if (error) throw error;
  return data.map((v) => ({
    id: v.id,
    type: v.type as Visa["type"],
    title: v.title,
    country: v.country,
    mode: v.mode,
    validityDays: v.validity_days,
    processingDays: v.processing_days,
    pricePkr: v.price_pkr,
    note: v.note ?? undefined,
  }));
}
