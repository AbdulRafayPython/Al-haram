import { getActiveBanner } from "@/lib/data/banners";
import { FlashBanner } from "./FlashBanner";

/**
 * Server-side slot for the flash banner: fetches the currently live banner and
 * renders nothing at all when the admin has none switched on. Sits at the very
 * top of the public layout so it appears above the Basmala bar on every page.
 *
 * Banner writes call `revalidatePath("/", "layout")`, so toggling one on or off
 * in the admin panel takes effect site-wide without a rebuild.
 */
export async function FlashBannerSlot() {
  const banner = await getActiveBanner();
  if (!banner) return null;
  return <FlashBanner banner={banner} />;
}
