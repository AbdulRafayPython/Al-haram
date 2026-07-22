import { anonClient } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/admin/refresh
 * Body: { "refreshToken": "..." }
 * Exchanges a refresh token for a fresh access token so the app can stay signed
 * in without asking for the password again.
 */
export const POST = handle(async (req) => {
  const body = await readJson(req);
  const refreshToken = requireString(body, "refreshToken");

  const supabase = anonClient();
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
  if (error || !data.session || !data.user) {
    throw new ApiError(401, "Refresh token is invalid or expired. Log in again.");
  }

  const role = (data.user.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin") {
    throw new ApiError(403, "This account does not have admin access.");
  }

  const { session, user } = data;
  return ok({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    tokenType: session.token_type,
    expiresIn: session.expires_in,
    expiresAt: session.expires_at,
    user: { id: user.id, email: user.email, role },
  });
});
