import { anonClient } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";

export { OPTIONS };

/**
 * POST /api/admin/login
 * Body: { "email": "...", "password": "..." }
 * Returns access + refresh tokens. Only accounts with the `admin` role are let
 * through — valid non-admin credentials are rejected.
 */
export const POST = handle(async (req) => {
  const body = await readJson(req);
  const email = requireString(body, "email");
  const password = requireString(body, "password");

  const supabase = anonClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new ApiError(401, "Invalid email or password.");
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
