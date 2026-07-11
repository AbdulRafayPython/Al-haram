import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { TransportRate } from "@/data/types";

export async function getTransportRates(): Promise<TransportRate[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transport_rates")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data.map((r) => ({
    id: r.id,
    from: r.route_from,
    to: r.route_to,
    category: r.category as TransportRate["category"],
    prices: {
      car: r.price_car ?? undefined,
      staria: r.price_staria ?? undefined,
      gmc: r.price_gmc ?? undefined,
      hiace: r.price_hiace ?? undefined,
      coaster: r.price_coaster ?? undefined,
    },
  }));
}

export interface TransportStats {
  total: number;
  vehicleGroups: number;
  partners: number;
  lowest: number;
}

export function getTransportStats(rates: TransportRate[]): TransportStats {
  const all = rates.flatMap((r) =>
    Object.values(r.prices).filter((v): v is number => v != null),
  );
  return {
    total: rates.length,
    vehicleGroups: 5,
    partners: 1,
    lowest: all.length ? Math.min(...all) : 0,
  };
}
