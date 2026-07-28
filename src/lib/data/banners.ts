import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isBannerVariant, type PromoBanner } from "@/data/banners";

const BANNER_SELECT =
  "id, label, message, cta_label, cta_href, variant, is_flashing, is_active, starts_at, ends_at, sort_order, updated_at";

type BannerRow = {
  id: string;
  label: string | null;
  message: string;
  cta_label: string | null;
  cta_href: string | null;
  variant: string;
  is_flashing: boolean;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  sort_order: number;
  updated_at: string;
};

function mapBanner(row: BannerRow): PromoBanner {
  return {
    id: row.id,
    label: row.label,
    message: row.message,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
    variant: isBannerVariant(row.variant) ? row.variant : "gold",
    isFlashing: row.is_flashing,
    isActive: row.is_active,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    sortOrder: row.sort_order,
    updatedAt: row.updated_at,
  };
}

/**
 * The one banner the public site should show right now, or null.
 *
 * "Live" = switched on AND inside its optional schedule window. Several banners
 * may qualify (campaigns overlap); the lowest sort_order wins, newest as the
 * tie-break, so an admin can queue the next campaign without turning this one
 * off first.
 */
export async function getActiveBanner(): Promise<PromoBanner | null> {
  const supabase = await createClient();
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from("promo_banners")
    .select(BANNER_SELECT)
    .eq("is_active", true)
    .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
    .or(`ends_at.is.null,ends_at.gt.${nowIso}`)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) throw error;
  return data.length ? mapBanner(data[0]) : null;
}

/** Every banner, live or not, for the admin Banners page. */
export async function getAllBanners(): Promise<PromoBanner[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("promo_banners")
    .select(BANNER_SELECT)
    .order("is_active", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapBanner);
}
