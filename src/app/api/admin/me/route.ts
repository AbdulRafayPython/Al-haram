import { requireAdmin } from "@/lib/api/auth";
import { handle, ok, OPTIONS } from "@/lib/api/http";

export { OPTIONS };

/**
 * GET /api/admin/me
 * Verifies the Bearer token and returns the signed-in admin. Useful for the app
 * to confirm a stored token is still valid on launch.
 */
export const GET = handle(async (req) => {
  const { userId, email } = await requireAdmin(req);
  return ok({ id: userId, email, role: "admin" });
});
