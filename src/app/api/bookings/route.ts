import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";

export { OPTIONS };

/**
 * GET /api/bookings   (admin)
 * Query: limit (default 100, max 500).
 * Booking leads created by the public "Book Now" flow, newest first.
 */
export const GET = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 500);

  const { data, error } = await supabase
    .from("bookings")
    .select("*, package:packages(title, departure_city, departure_date)")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new ApiError(500, error.message);

  const bookings = (data ?? []).map((b) => ({
    id: b.id,
    reference: b.reference,
    packageId: b.package_id,
    package: b.package ?? null,
    name: b.name,
    phone: b.phone,
    adults: b.adults,
    childNoBed: b.child_no_bed,
    infants: b.infants,
    roomType: b.room_type,
    unitPrice: b.unit_price,
    totalPkr: b.total_pkr,
    status: b.status,
    createdAt: b.created_at,
  }));
  return ok(bookings, { count: bookings.length });
});
