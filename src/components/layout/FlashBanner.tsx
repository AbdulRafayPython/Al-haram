"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import type { BannerVariant, PromoBanner } from "@/data/banners";

/**
 * Flash offer card — a centred modal, not a top strip.
 *
 * Everything it shows is data from the `promo_banners` table, so a new campaign
 * is a new row in the admin panel, never a code change. See
 * src/app/admin/(dashboard)/banners.
 *
 * Dismissal is per browser-tab session (sessionStorage), keyed by banner id +
 * updatedAt: closing it hides it for the rest of the session, but editing the
 * copy in the admin panel makes it a "new" card and it shows again.
 */

/** Accent per variant. Surfaces stay dark and neutral — the accent does the work. */
const accents: Record<BannerVariant, { badge: string; cta: string; glow: string; rule: string }> = {
  gold: {
    badge: "bg-secondary-fixed/15 text-secondary ring-1 ring-inset ring-secondary/30",
    cta: "bg-secondary-fixed text-on-secondary-fixed hover:brightness-105",
    glow: "shadow-[0_0_60px_-12px_rgba(242,178,30,0.35)]",
    rule: "from-transparent via-secondary/60 to-transparent",
  },
  navy: {
    badge: "bg-primary-container/60 text-on-primary-container ring-1 ring-inset ring-primary-container",
    cta: "bg-primary-fixed text-on-primary hover:brightness-125",
    glow: "shadow-[0_0_60px_-12px_rgba(37,57,95,0.55)]",
    rule: "from-transparent via-primary-container to-transparent",
  },
  dark: {
    badge: "bg-white/[0.06] text-on-surface-variant ring-1 ring-inset ring-white/15",
    cta: "bg-white/[0.09] text-on-surface ring-1 ring-inset ring-white/20 hover:bg-white/[0.14]",
    glow: "shadow-[0_0_60px_-16px_rgba(0,0,0,0.9)]",
    rule: "from-transparent via-white/20 to-transparent",
  },
};

function dismissKey(banner: PromoBanner) {
  return `ste:banner-dismissed:${banner.id}:${banner.updatedAt}`;
}

/* sessionStorage is an external store, so it's read through
   useSyncExternalStore rather than mirrored into state in an effect.
   `listeners` exists because the `storage` event doesn't fire in the tab that
   wrote the value — the tab that dismissed the card has to notify itself. */
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
    // Storage disabled — show the card rather than silently swallow the offer.
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
  /** Admin live preview: no dismissal state, no backdrop, inert close button. */
  preview = false,
}: {
  banner: PromoBanner;
  preview?: boolean;
}) {
  const key = dismissKey(banner);
  const dismissed = useSyncExternalStore(
    subscribeToDismissals,
    () => (preview ? false : readDismissed(key)),
    // Server snapshot assumes not-dismissed so the card is in the SSR HTML.
    () => false,
  );

  // Held back a beat so the card arrives over a settled page rather than
  // competing with first paint — the difference between premium and pop-up.
  const [entered, setEntered] = useState(preview);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (preview || dismissed) return;
    const t = window.setTimeout(() => setEntered(true), 650);
    return () => window.clearTimeout(t);
  }, [preview, dismissed]);

  // Lock scroll, close on Escape, and move focus to the close button so the
  // card is escapable by keyboard the moment it appears.
  useEffect(() => {
    if (preview || dismissed || !entered) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") writeDismissed(key);
    };
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [preview, dismissed, entered, key]);

  if (dismissed) return null;

  const accent = accents[banner.variant];
  const isInternalCta = Boolean(banner.ctaHref?.startsWith("/"));

  function dismiss() {
    if (preview) return;
    writeDismissed(key);
  }

  const card = (
    <div
      className={clsx(
        "relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10",
        "bg-surface-container-lowest text-left",
        accent.glow,
        !preview && "transition-all duration-500 ease-out motion-reduce:transition-none",
        !preview && (entered ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"),
      )}
      role={preview ? undefined : "dialog"}
      aria-modal={preview ? undefined : true}
      aria-label="Special offer"
    >
      {/* Hero image */}
      {banner.imageUrl && (
        <div className="relative h-40 w-full overflow-hidden sm:h-44">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={banner.imageUrl}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            decoding="async"
          />
          {/* Fades the photo into the card instead of ending on a hard edge. */}
          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-surface-container-lowest/25 to-transparent" />
        </div>
      )}

      <button
        ref={closeRef}
        type="button"
        onClick={dismiss}
        disabled={preview}
        aria-label="Close offer"
        className={clsx(
          "absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full",
          "bg-black/45 text-white/90 backdrop-blur-sm transition-colors",
          "hover:bg-black/70 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        )}
      >
        <Icon name="close" className="text-xl" />
      </button>

      <div className={clsx("px-6 pb-6", banner.imageUrl ? "-mt-6 pt-0" : "pt-8")}>
        {banner.label && (
          <span
            className={clsx(
              "inline-flex items-center gap-1.5 rounded-full px-3 py-1",
              "text-[0.65rem] font-bold uppercase tracking-[0.14em]",
              accent.badge,
            )}
          >
            {banner.isFlashing && (
              <span className="flash-banner-blink h-1.5 w-1.5 rounded-full bg-current" />
            )}
            {banner.label}
          </span>
        )}

        {banner.title && (
          <h2 className="mt-3 font-[var(--font-display)] text-2xl font-bold leading-tight text-on-surface">
            {banner.title}
          </h2>
        )}

        <p
          className={clsx(
            "text-on-surface-variant",
            banner.title ? "mt-2 text-sm leading-relaxed" : "mt-3 text-base leading-relaxed",
          )}
        >
          {banner.message}
        </p>

        {banner.highlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {banner.highlights.map((h) => (
              <span
                key={h}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-on-surface-variant"
              >
                {h}
              </span>
            ))}
          </div>
        )}

        {banner.ctaHref && banner.ctaLabel && (
          <>
            <div className={clsx("mt-5 h-px bg-gradient-to-r", accent.rule)} />
            {isInternalCta ? (
              <Link
                href={banner.ctaHref}
                onClick={dismiss}
                className={clsx(
                  "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5",
                  "text-sm font-bold uppercase tracking-widest transition-all",
                  accent.cta,
                )}
              >
                {banner.ctaLabel}
                <Icon name="arrow_forward" className="text-base" />
              </Link>
            ) : (
              <a
                href={banner.ctaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismiss}
                className={clsx(
                  "mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5",
                  "text-sm font-bold uppercase tracking-widest transition-all",
                  accent.cta,
                )}
              >
                {banner.ctaLabel}
                <Icon name="arrow_forward" className="text-base" />
              </a>
            )}
          </>
        )}
      </div>
    </div>
  );

  // The preview in the admin panel is just the card, sitting in the page.
  if (preview) return card;

  return (
    <div
      className={clsx(
        "fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto p-4",
        "bg-black/70 backdrop-blur-sm transition-opacity duration-500 motion-reduce:transition-none",
        entered ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      onClick={dismiss}
    >
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md">
        {card}
      </div>
    </div>
  );
}
