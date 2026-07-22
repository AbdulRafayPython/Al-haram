/**
 * Bearer-token auth for the mobile REST API.
 *
 * The app logs in via POST /api/admin/login (Supabase email/password) and gets
 * an access token. It then sends `Authorization: Bearer <accessToken>` on every
 * write. `requireAdmin` validates that token, confirms the `admin` role, and
 * returns a Supabase client that carries the token — so PostgREST runs every
 * query under the caller's identity and the database RLS policies
 * (`public.is_admin()`) are the real security boundary, not this check alone.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";
import { ApiError } from "./http";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;

export type ApiSupabase = ReturnType<typeof createClient<Database>>;

/** Plain, session-less client (publishable key) — used for the login/refresh calls. */
export function anonClient(): ApiSupabase {
  return createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Extract the raw JWT from an `Authorization: Bearer <token>` header. */
export function bearerToken(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

export interface AdminAuth {
  /** RLS-scoped client: all queries run as the authenticated admin. */
  supabase: ApiSupabase;
  userId: string;
  email: string | undefined;
}

/**
 * Validate the Bearer token and require the `admin` role. Throws a 401/403
 * `ApiError` otherwise. The returned client carries the token, so table writes
 * pass RLS as this admin.
 */
export async function requireAdmin(req: Request): Promise<AdminAuth> {
  const token = bearerToken(req);
  if (!token) {
    throw new ApiError(401, "Missing token. Send 'Authorization: Bearer <accessToken>'.");
  }

  const supabase = createClient<Database>(SUPABASE_URL, PUBLISHABLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new ApiError(401, "Invalid or expired token. Log in again.");
  }

  const role = (data.user.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin") {
    throw new ApiError(403, "This account does not have admin access.");
  }

  return { supabase, userId: data.user.id, email: data.user.email };
}

/**
 * Best-effort admin detection for endpoints that are public but reveal more to
 * an admin (e.g. GET /api/packages?status=all). Returns null instead of throwing
 * when there is no valid admin token.
 */
export async function optionalAdmin(req: Request): Promise<AdminAuth | null> {
  if (!bearerToken(req)) return null;
  try {
    return await requireAdmin(req);
  } catch {
    return null;
  }
}
