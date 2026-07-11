import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface ContactInput {
  name: string;
  phone?: string;
  email?: string;
  message: string;
}

export async function insertContact(input: ContactInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("contacts").insert({
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    message: input.message,
  });
  if (error) throw error;
}
