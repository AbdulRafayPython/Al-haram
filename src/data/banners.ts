/**
 * Flash / promo banner vocabulary — shared by the server query layer
 * (`lib/data/banners.ts`), the server actions, and the client components.
 * Kept out of `lib/data` because that module is `server-only`.
 */

/** Visual treatments a banner can use. Maps to design-system tokens, not raw colours. */
export const BANNER_VARIANTS = ["gold", "navy", "dark"] as const;
export type BannerVariant = (typeof BANNER_VARIANTS)[number];

export function isBannerVariant(value: unknown): value is BannerVariant {
  return typeof value === "string" && (BANNER_VARIANTS as readonly string[]).includes(value);
}

export const bannerVariantLabels: Record<BannerVariant, string> = {
  gold: "Gold (bright)",
  navy: "Navy (deep)",
  dark: "Dark (subtle)",
};

export interface PromoBanner {
  id: string;
  /** Short bold lead-in, e.g. "Limited Time Offer". */
  label: string | null;
  message: string;
  ctaLabel: string | null;
  ctaHref: string | null;
  variant: BannerVariant;
  isFlashing: boolean;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  sortOrder: number;
  /** Bumped on every edit — the public dismissal key includes it, so edited copy re-shows. */
  updatedAt: string;
}
