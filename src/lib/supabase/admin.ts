import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role client for trusted, already-admin-gated server actions.
 * Bypasses RLS entirely — every caller MUST call `assertAdmin()` first.
 *
 * Used only for Storage writes (hotel images, airline logos), where the
 * publishable-key + session-cookie path is subject to a JWT-propagation
 * race between PostgREST and the Storage service: a freshly-rotated access
 * token is accepted for regular table writes but can still be rejected by
 * Storage's RLS check for a brief window, surfacing as an intermittent
 * "new row violates row-level security policy" error. The service-role key
 * sidesteps that race since it never depends on session/token timing.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to web/.env.local — find it in the " +
        "Supabase dashboard under Project Settings -> API -> service_role secret key.",
    );
  }
  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
