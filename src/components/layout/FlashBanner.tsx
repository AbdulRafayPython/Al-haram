"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import type { BannerVariant, PromoBanner } from "@/data/banners";

/**
 * Reusable flash / promo banner. Everything it shows is data from the
 * `promo_banners` table, so a new campaign is a new row in the admin panel —
 * never a code change. See src/app/admin/(dashboard)/banners.
 *
 * Dismissal is per browser-tab session (sessionStorage), keyed by banner id +
 * updatedAt: closing it hides it for the rest of the session, but editing the
 * copy in the admin panel makes it a "new" banner and it shows again.
 */

const variantStyles: Record<BannerVariant, { bar: string; label: string; close: string; cta: string }> = {
  gold: {
    bar: "bg-secondary-fixed text-on-secondary-fixed",
    label: "bg-on-secondary-fixed/15 text-on-secondary-fixed",
    close: "hover:bg-on-secondary-fixed/15",
    cta: "border-on-secondary-fixed/40 hover:bg-on-secondary-fixed/15",
  },
  navy: {
    bar: "bg-primary text-on-primary",
    label: "bg-secondary-fixed text-on-secondary-fixed",
    close: "hover:bg-white/15",
    cta: "border-secondary-fixed/70 text-secondary-fixed hover:bg-secondary-fixed/15",
  },
  dark: {
    bar: "bg-tertiary text-on-tertiary",
    label: "bg-secondary-container text-on-secondary-container",
    close: "hover:bg-white/10",
    cta: "border-secondary/60 text-secondary hover:bg-secondary/10",
  },
};

function dismissKey(banner: PromoBanner) {
  return `ste:banner-dismissed:${banner.id}:${banner.updatedAt}`;
}

/* sessionStorage is an external store, so it's read through
   useSyncExternalStore rather than mirrored into state in an effect.
   `listeners` exists because the `storage` event doesn't fire in the tab that
   wrote the value — the tab that dismissed the banner has to notify itself. */
const listeners = new Set<() => void>();
/** Backs up the dismissal when storage is unavailable (private mode), so the
    close button still works — just only until the next full page load. */
const dismissedThisPageView = new Set<string>();

function subscribeToDismissals(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function readDismissed(key: string): boolean {
  if (dismissedThisPageView.has(key)) return true;
  try {
    return window.sessionStorage.getItem(key) === "1";
  } catch {
    // Storage disabled — show the banner rather than silently swallow the offer.
    return false;
  }
}

function writeDismissed(key: string) {
  dismissedThisPageView.add(key);
  try {
    window.sessionStorage.setItem(key, "1");
  } catch {
    // No storage to persist to; the in-memory set covers this page view.
  }
  listeners.forEach((notify) => notify());
}

export function FlashBanner({
  banner,
  /** Admin live preview: never reads/writes dismissal state, close button is inert. */
  preview = false,
}: {
  banner: PromoBanner;
  preview?: boolean;
}) {
  const key = dismissKey(banner);
  const dismissed = useSyncExternalStore(
    subscribeToDismissals,
    () => (preview ? false : readDismissed(key)),
    // Server render assumes not-dismissed: the common case then ships in the
    // HTML with no layout shift. A visitor who already closed it sees it
    // removed on hydration, and only on a full reload.
    () => false,
  );

  if (dismissed) return null;

  const styles = variantStyles[banner.variant];
  const flashing = banner.isFlashing;
  const isInternalCta = Boolean(banner.ctaHref?.startsWith("/"));

  function dismiss() {
    if (preview) return;
    writeDismissed(key);
  }

  const ctaClass = clsx(
    "shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-[0.7rem] font-bold uppercase tracking-wider transition-colors",
    styles.cta,
  );

  return (
    <div
      role="region"
      aria-label="Site announcement"
      className={clsx("relative overflow-hidden", styles.bar, flashing && "flash-banner-pulse")}
    >
      {/* Sheen sweep — decorative, sits above the bar but under the content. */}
      {flashing && (
        <span
          aria-hidden="true"
          className="flash-banner-sheen pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent"
        />
      )}

      <Container className="relative flex items-center justify-center gap-x-3 gap-y-1 py-2 pr-8 text-center sm:pr-10">
        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
          {banner.label && (
            <span
              className={clsx(
                "shrink-0 rounded-full px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-widest",
                styles.label,
                flashing && "flash-banner-blink",
              )}
            >
              {banner.label}
            </span>
          )}

          <p className="text-xs font-semibold leading-snug sm:text-sm">{banner.message}</p>

          {banner.ctaHref &&
            banner.ctaLabel &&
            (isInternalCta ? (
              <Link href={banner.ctaHref} className={ctaClass}>
                {banner.ctaLabel}
              </Link>
            ) : (
              <a
                href={banner.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                className={ctaClass}
              >
                {banner.ctaLabel}
              </a>
            ))}
        </div>

        <button
          type="button"
          onClick={dismiss}
          disabled={preview}
          aria-label="Dismiss announcement"
          className={clsx(
            "absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors sm:right-4",
            styles.close,
          )}
        >
          <Icon name="close" className="text-base" />
        </button>
      </Container>
    </div>
  );
}
