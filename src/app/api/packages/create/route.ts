import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS, readJson } from "@/lib/api/http";
import { buildImportContext, getSerializedPackage } from "@/lib/api/packages";
import { parseAndValidatePackageJson } from "@/lib/importPackage";
import { assertPackageValid, packageInputToRow } from "@/lib/packageRow";

export { OPTIONS };

/**
 * POST /api/packages/create   (admin)
 * Body: the same JSON shape as the admin panel's "Import a package" feature
 * (hotels/city/airline by name). Optional `isPublished` (default true).
 * See GET /api/packages/sample for a copy-paste template.
 */
export const POST = handle(async (req) => {
  const { supabase } = await requireAdmin(req);
  const body = await readJson(req);

  // isPublished isn't part of the package validator — pull it out and apply it directly.
  const isPublished = body.isPublished;
  if (isPublished !== undefined && typeof isPublished !== "boolean") {
    throw new ApiError(400, '"isPublished" must be true or false.');
  }

  const ctx = await buildImportContext(supabase);
  const result = parseAndValidatePackageJson(JSON.stringify(body), ctx);
  if (!result.ok || !result.value) {
    throw new ApiError(422, "Package validation failed.", result.errors);
  }
  assertPackageValid(result.value);

  const row = packageInputToRow(result.value);
  const insert = isPublished === undefined ? row : { ...row, is_published: isPublished };
  const { data, error } = await supabase.from("packages").insert(insert).select("id").single();
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/");
  const created = await getSerializedPackage(supabase, data.id);
  return ok(created, { warnings: result.warnings }, 201);
});
