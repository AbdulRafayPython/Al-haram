import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";

export { OPTIONS };

/**
 * GET /api/contacts   (admin)
 * Query: limit (default 100, max 500).
 * Contact-form submissions, newest first.
 */
export const GET = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? 100);
  const limit = Math.min(Math.max(Number.isFinite(limitParam) ? limitParam : 100, 1), 500);

  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new ApiError(500, error.message);

  const contacts = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    message: c.message,
    createdAt: c.created_at,
  }));
  return ok(contacts, { count: contacts.length });
});
