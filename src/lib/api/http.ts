/**
 * Shared helpers for the mobile REST API (`app/api/**`): a consistent JSON
 * envelope, CORS, and a wrapper that turns thrown errors into clean responses.
 *
 * Envelope:
 *   success -> { ok: true, data, ...extra }   (HTTP 200 / 201)
 *   failure -> { ok: false, error, details? } (HTTP 4xx / 5xx)
 *
 * The app never has to guess: check `ok`, then read `data` or `error`.
 */
import { NextResponse, type NextRequest } from "next/server";

/** CORS: reads are public and auth is a Bearer header (no cookies), so `*` is safe. */
export const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400",
};

/** An error with an HTTP status the wrapper turns into a JSON failure response. */
export class ApiError extends Error {
  status: number;
  details?: string[];
  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function ok(data: unknown, extra?: Record<string, unknown>, status = 200) {
  return NextResponse.json({ ok: true, data, ...extra }, { status, headers: CORS_HEADERS });
}

export function fail(status: number, error: string, details?: string[]) {
  return NextResponse.json(
    { ok: false, error, ...(details && details.length ? { details } : {}) },
    { status, headers: CORS_HEADERS },
  );
}

/** Preflight handler — re-exported as `OPTIONS` from every route file. */
export function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * Wraps a route handler so any thrown `ApiError` (or unexpected error) becomes a
 * consistent JSON failure with CORS headers instead of an HTML 500 page.
 *
 * Generic over the context type so it preserves each route's exact `params`
 * shape — Next.js validates handler signatures against generated route types at
 * build time, and a fixed context type would break dynamic (`[id]`) routes.
 */
export function handle<C>(
  fn: (req: NextRequest, ctx: C) => Promise<Response> | Response,
): (req: NextRequest, ctx: C) => Promise<Response> {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (e) {
      if (e instanceof ApiError) return fail(e.status, e.message, e.details);
      const message = e instanceof Error ? e.message : "Unexpected server error.";
      return fail(500, message);
    }
  };
}

/** Parse a JSON body, throwing a clean 400 if it is missing or malformed. */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON.");
  }
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new ApiError(400, "Request body must be a JSON object.");
  }
  return body as Record<string, unknown>;
}

/** Require a non-empty string field from a JSON body. */
export function requireString(body: Record<string, unknown>, key: string): string {
  const v = body[key];
  if (typeof v !== "string" || !v.trim()) {
    throw new ApiError(400, `"${key}" is required.`);
  }
  return v.trim();
}
