import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Hotel } from "@/data/types";

export async function getHotels(): Promise<Hotel[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("hotels")
    .select("*")
    .order("city")
    .order("name");
  if (error) throw error;
  return data.map((h) => ({
    id: h.id,
    name: h.name,
    city: h.city as Hotel["city"],
    location: h.location,
    distance: h.distance,
    rates: {
      sharing: h.rate_sharing ?? undefined,
      double: h.rate_double,
      triple: h.rate_triple,
      quad: h.rate_quad,
    },
    hasImage: h.has_image || Boolean(h.image_url),
    imageUrl: h.image_url,
  }));
}

export interface HotelStats {
  total: number;
  makkah: number;
  madinah: number;
  withImages: number;
}

export function getHotelStats(hotels: Hotel[]): HotelStats {
  return {
    total: hotels.length,
    makkah: hotels.filter((h) => h.city === "Makkah").length,
    madinah: hotels.filter((h) => h.city === "Madinah").length,
    withImages: hotels.filter((h) => h.hasImage).length,
  };
}
