import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Testimonial } from "@/data/types";

export async function getTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at");
  if (error) throw error;
  return data.map((t) => ({
    name: t.name,
    date: t.testimonial_date,
    rating: t.rating,
    quote: t.quote,
  }));
}
