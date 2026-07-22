import { handle, ok, OPTIONS } from "@/lib/api/http";
import { PACKAGE_JSON_SAMPLE, PACKAGE_JSON_FIELD_NOTES } from "@/lib/importPackage";

export { OPTIONS };

/**
 * GET /api/packages/sample
 * The copy-paste JSON template + field guide for POST /api/packages/create.
 * `sample` is returned both as a parsed object and as the raw string.
 */
export const GET = handle(async () => {
  return ok({
    sample: JSON.parse(PACKAGE_JSON_SAMPLE),
    sampleRaw: PACKAGE_JSON_SAMPLE,
    fields: PACKAGE_JSON_FIELD_NOTES,
  });
});
