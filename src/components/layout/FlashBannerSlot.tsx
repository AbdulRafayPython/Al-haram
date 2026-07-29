import { getActiveBanner } from "@/lib/data/banners";
import { FlashBanner } from "./FlashBanner";

/**
 * Server-side slot for the flash offer card: fetches the currently live banner
 * and renders nothing at all when the admin has none switched on.
 *
 * The card itself is a centred fixed overlay, so its position in the layout
 * tree doesn't affect where it appears — it stays mounted first only so the
 * markup ships with the initial HTML.
 *
 * Banner writes call `revalidatePath("/", "layout")`, so toggling one on or off
 * in the admin panel takes effect site-wide without a rebuild.
 */
export async function FlashBannerSlot() {
  const banner = await getActiveBanner();
  if (!banner) return null;
  return <FlashBanner banner={banner} />;
}
