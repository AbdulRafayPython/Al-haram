import type { Metadata } from "next";
import { getAllBanners } from "@/lib/data/banners";
import { BannersAdmin } from "./BannersAdmin";

export const metadata: Metadata = {
  title: "Flash Banners",
  robots: { index: false, follow: false },
};

// Always reflect the latest toggle/edit.
export const dynamic = "force-dynamic";

export default async function AdminBannersPage() {
  const banners = await getAllBanners();

  return (
    <div>
      <h1 className="font-[var(--font-heading)] text-2xl text-on-surface">Flash Banners</h1>
      <p className="mt-1 text-sm text-on-surface-variant">
        Promotional card shown in the middle of the screen on every page of the public site. Switch one
        on and it appears instantly; visitors can dismiss it for their session.
      </p>

      <div className="mt-6 max-w-4xl">
        <BannersAdmin banners={banners} />
      </div>
    </div>
  );
}
