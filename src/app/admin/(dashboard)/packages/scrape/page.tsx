import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ScrapePackageForm } from "./ScrapePackageForm";

export const metadata: Metadata = {
  title: "Scrape Package from URL",
  robots: { index: false, follow: false },
};

export default function ScrapePackagePage() {
  return (
    <div>
      <Link
        href="/admin/packages"
        className="inline-flex items-center gap-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <Icon name="arrow_back" className="text-base" /> Back to packages
      </Link>
      <h1 className="mt-3 font-[var(--font-heading)] text-2xl text-on-surface">Scrape Package from URL</h1>
      <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
        Paste a public package page and let the scraper draft the JSON for you. It fills what it can read,
        maps airlines, cities, and hotels to your existing records, and hands you an editable draft — then
        the same validate → preview → create checks run before anything is saved.
      </p>
      <div className="mt-6">
        <ScrapePackageForm />
      </div>
    </div>
  );
}
