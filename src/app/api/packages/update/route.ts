import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson, requireString } from "@/lib/api/http";
import {
  buildImportContext,
  getSerializedPackage,
  mergePackagePatch,
  packageRowToImportObject,
  PACKAGE_SELECT,
  type PackageRowWithHotels,
} from "@/lib/api/packages";
import { parseAndValidatePackageJson } from "@/lib/importPackage";
import { assertPackageValid, packageInputToRow } from "@/lib/packageRow";

export { OPTIONS };

/**
 * POST /api/packages/update   (admin)
 * Body: { "id": "...", ...fields }
 *
 * A PARTIAL update — send only what changes. The most common call is a rate
 * edit: { "id": "...", "prices": { "quad": 290000 } }. Other examples:
 *   { "id": "...", "seatsAvailable": 12 }
 *   { "id": "...", "isPublished": false }
 *   { "id": "...", "flight": { "departureTime": "20:15" } }
 *
 * We rebuild the existing package, merge your fields on top, and re-run the same
 * validator the admin panel uses — so the result is always a fully valid package.
 * `prices` and `flight` merge one level deep (other tiers/legs are preserved).
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);
  const id = requireString(body, "id");

  const { id: _id, isPublished, ...patch } = body;
  void _id;
  if (isPublished !== undefined && typeof isPublished !== "boolean") {
    throw new ApiError(400, '"isPublished" must be true or false.');
  }

  const { data: existing, error: loadError } = await supabase
    .from("packages")
    .select(PACKAGE_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (loadError) throw new ApiError(500, loadError.message);
  if (!existing) throw new ApiError(404, "Package not found.");

  const base = packageRowToImportObject(existing as unknown as PackageRowWithHotels);
  const merged = mergePackagePatch(base, patch);

  const ctx = await buildImportContext(supabase);
  const result = parseAndValidatePackageJson(JSON.stringify(merged), ctx);
  if (!result.ok || !result.value) {
    throw new ApiError(422, "Package validation failed.", result.errors);
  }
  assertPackageValid(result.value);

  const row = packageInputToRow(result.value);
  const update = isPublished === undefined ? row : { ...row, is_published: isPublished };
  const { error } = await supabase.from("packages").update(update).eq("id", id);
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/");
  const updated = await getSerializedPackage(supabase, id);
  return ok(updated, { warnings: result.warnings });
});
