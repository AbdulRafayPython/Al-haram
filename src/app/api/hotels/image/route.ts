import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/api/auth";
import { ApiError, handle, ok, OPTIONS } from "@/lib/api/http";
import { createAdminClient } from "@/lib/supabase/admin";

export { OPTIONS };

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * POST /api/hotels/image   (admin, multipart/form-data)
 * Fields: hotelId (required), file (image) OR remove="true".
 * Uploads/replaces a hotel image, or clears it. Storage writes use the
 * service-role client (see src/lib/supabase/admin.ts), so the token is
 * validated first via requireAdmin.
 */
export const POST = handle(async (req) => {
  await requireAdmin(req);

  const form = await req.formData().catch(() => {
    throw new ApiError(400, "Expected multipart/form-data.");
  });
  const hotelId = String(form.get("hotelId") ?? "").trim();
  if (!hotelId) throw new ApiError(400, '"hotelId" is required.');

  const admin = createAdminClient();
  const remove = form.get("remove");

  if (remove === "true" || remove === "1") {
    const { error } = await admin
      .from("hotels")
      .update({ image_url: null, has_image: false })
      .eq("id", hotelId);
    if (error) throw new ApiError(400, error.message);
    revalidatePath("/saudi-hotels");
    return ok({ hotelId, imageUrl: null });
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new ApiError(400, 'Attach an image as "file", or send remove="true".');
  }
  if (!file.type.startsWith("image/")) throw new ApiError(400, "Only image files are allowed.");
  if (file.size > MAX_BYTES) throw new ApiError(400, "Image must be under 5 MB.");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${hotelId}/${Date.now()}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("hotel-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new ApiError(400, uploadError.message);

  const { data: pub } = admin.storage.from("hotel-images").getPublicUrl(path);
  const { error } = await admin
    .from("hotels")
    .update({ image_url: pub.publicUrl, has_image: true })
    .eq("id", hotelId);
  if (error) throw new ApiError(400, error.message);

  revalidatePath("/saudi-hotels");
  return ok({ hotelId, imageUrl: pub.publicUrl }, undefined, 201);
});
