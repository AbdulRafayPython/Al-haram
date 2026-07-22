import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";
import { createAdminClient } from "@/lib/supabase/admin";

export { OPTIONS };

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * POST /api/airlines/logo   (admin, multipart/form-data)
 * Fields: airlineId (required), file (image) OR remove="true".
 * Uploaded logos are converted to a compact 256px WebP before storage.
 */
export const POST = handle(async (req) => {
  await requireAdmin(req);

  const form = await req.formData().catch(() => {
    throw new ApiError(400, "Expected multipart/form-data.");
  });
  const airlineId = String(form.get("airlineId") ?? "").trim();
  if (!airlineId) throw new ApiError(400, '"airlineId" is required.');

  const admin = createAdminClient();
  const remove = form.get("remove");

  if (remove === "true" || remove === "1") {
    const { error } = await admin.from("airlines").update({ logo_url: null }).eq("id", airlineId);
    if (error) throw new ApiError(400, error.message);
    revalidatePath("/");
    return ok({ airlineId, logoUrl: null });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, 'Attach a logo as "file", or send remove="true".');
  }
  if (!file.type.startsWith("image/")) throw new ApiError(400, "Only image files are allowed.");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Image must be under 5 MB.");

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(inputBuffer)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const path = `${airlineId}/${Date.now()}.webp`;
  const { error: uploadError } = await admin.storage
    .from("airline-logos")
    .upload(path, webpBuffer, { upsert: true, contentType: "image/webp" });
  if (uploadError) throw new ApiError(400, uploadError.message);

  const { data: pub } = admin.storage.from("airline-logos").getPublicUrl(path);
  const { error } = await admin
    .from("airlines")
    .update({ logo_url: pub.publicUrl })
    .eq("id", airlineId);
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/");
  return ok({ airlineId, logoUrl: pub.publicUrl }, undefined, 201);
});
