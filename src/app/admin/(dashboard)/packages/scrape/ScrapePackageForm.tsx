"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { scrapePackageAction, type ScrapeActionResult } from "@/app/admin/actions";
import { PackageJsonEditor, Alert } from "../PackageJsonEditor";

export function ScrapePackageForm() {
  const [url, setUrl] = useState("");
  const [raw, setRaw] = useState("");
  const [scrape, setScrape] = useState<ScrapeActionResult | null>(null);
  const [pending, startTransition] = useTransition();

  function runScrape() {
    startTransition(async () => {
      const res = await scrapePackageAction(url);
      setScrape(res);
      if (res.ok && res.json) setRaw(res.json);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-5">
        {/* URL box */}
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Package page URL
            </span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="url"
                inputMode="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && url.trim() && !pending) {
                    e.preventDefault();
                    runScrape();
                  }
                }}
                placeholder="https://example.com/umrah-packages/premium-20-days"
                className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
              <button
                type="button"
                onClick={runScrape}
                disabled={pending || !url.trim()}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-40"
              >
                {pending ? (
                  <Icon name="progress_activity" className="animate-spin text-base" />
                ) : (
                  <Icon name="travel_explore" className="text-base" />
                )}
                {pending ? "Scraping…" : "Scrape"}
              </button>
            </div>
          </label>
          <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
            Paste the address of a public Umrah-package page. The scraper reads the page and fills in what it
            can, then you review and complete the draft below. Nothing is saved until you validate and confirm.
          </p>
        </div>

        {/* Scrape outcome */}
        {scrape?.error && <Alert tone="error" title="Couldn't scrape that page" lines={[scrape.error]} />}

        {scrape?.ok && (
          <>
            <Alert
              tone={scrape.missing.length ? "warning" : "success"}
              title={
                scrape.found.length
                  ? `Filled ${scrape.found.length} field${scrape.found.length === 1 ? "" : "s"} from the page`
                  : "Read the page, but couldn't confidently fill any fields"
              }
              lines={[
                ...(scrape.found.length ? [`Found: ${scrape.found.join(", ")}.`] : []),
                ...(scrape.missing.length
                  ? [`Still needed (edit below): ${scrape.missing.join("; ")}.`]
                  : ["All required fields look filled — validate to confirm."]),
              ]}
            />
            {scrape.warnings.length > 0 && (
              <Alert tone="info" title="Guessed — please verify" lines={scrape.warnings} />
            )}
          </>
        )}

        {/* Editable draft → same validate/preview/create pipeline as JSON import */}
        {raw ? (
          <PackageJsonEditor raw={raw} onRawChange={setRaw} label="Scraped draft (edit to complete)" />
        ) : null}
      </div>

      {/* Tips */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
          <h2 className="font-[var(--font-heading)] text-base text-on-surface">How it works</h2>
          <ol className="mt-3 space-y-2.5 text-xs text-on-surface-variant">
            <li className="flex gap-2">
              <span className="font-semibold text-secondary">1.</span>
              Paste a public package page URL and press <span className="font-semibold">Scrape</span>.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-secondary">2.</span>
              It fills a JSON draft — most reliably the airline, city, and Makkah/Madinah hotels when they
              match records you already have.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-secondary">3.</span>
              Fix or fill anything it missed in the draft box, then{" "}
              <span className="font-semibold">Validate &amp; Preview</span>.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-secondary">4.</span>
              <span className="font-semibold">Create Package</span> once the preview looks right.
            </li>
          </ol>
          <p className="mt-4 rounded-lg border border-outline-variant/40 bg-surface p-3 text-[0.7rem] leading-relaxed text-on-surface-variant">
            Prices, dates, and flight numbers are best-effort guesses — always double-check them. Cities,
            airlines, and hotels must match your existing records; add them under their admin pages first if
            the scraper couldn't map them.
          </p>
        </div>
      </aside>
    </div>
  );
}
