"use server";

import { insertContact } from "@/lib/data/contacts";

export async function submitContact(input: {
  name: string;
  phone: string;
  email: string;
  message: string;
}) {
  if (!input.name.trim() || !input.message.trim()) return;
  await insertContact(input);
}
