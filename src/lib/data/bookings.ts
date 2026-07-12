import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface CreateBookingInput {
  packageId: string;
  name: string;
  phone: string;
  adults: number;
  children: number;
  infants: number;
  roomType: string;
}

export interface BookingResult {
  reference: string;
  total: number;
  unitPrice: number;
}

const PRICE_COLUMN = {
  Sharing: "price_sharing",
  Quad: "price_quad",
  Triple: "price_triple",
  Double: "price_double",
} as const;

function makeReference(): string {
  const time = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `STE-${time}${rand}`;
}

/**
 * Create a booking. The total is recomputed server-side from the package's own
 * prices — the client's numbers are never trusted.
 */
export async function createBooking(input: CreateBookingInput): Promise<BookingResult> {
  const supabase = await createClient();

  const { data: pkg, error: pkgError } = await supabase
    .from("packages")
    .select("price_sharing, price_quad, price_triple, price_double, price_infant, room_types, is_published")
    .eq("id", input.packageId)
    .single();

  if (pkgError || !pkg) throw new Error("Package not found.");
  if (!pkg.is_published) throw new Error("This package is no longer available.");

  const column = PRICE_COLUMN[input.roomType as keyof typeof PRICE_COLUMN];
  if (!column || !(pkg.room_types ?? []).includes(input.roomType)) {
    throw new Error("Selected room type is not available for this package.");
  }

  const unitPrice = Number(pkg[column] ?? 0);
  const infantPrice = Number(pkg.price_infant ?? 0);
  const payingHeads = Math.max(0, input.adults) + Math.max(0, input.children);
  const total = unitPrice * payingHeads + infantPrice * Math.max(0, input.infants);

  const reference = makeReference();
  const { error } = await supabase.from("bookings").insert({
    package_id: input.packageId,
    reference,
    name: input.name.trim() || null,
    phone: input.phone.trim() || null,
    adults: input.adults,
    children: input.children,
    infants: input.infants,
    room_type: input.roomType,
    unit_price: unitPrice,
    total_pkr: total,
  });
  if (error) throw new Error(error.message);

  return { reference, total, unitPrice };
}
