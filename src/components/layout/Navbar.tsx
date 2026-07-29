"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { mainNav, site, socialLinks } from "@/data/site";

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="relative z-50">
      {/* Top utility bar — the Basmala sits centred here on every page.
          Phone and socials are the flanking rails; on small screens they drop
          away so the Basmala keeps the full width and stays centred. */}
      <div className="bg-tertiary text-on-tertiary/80">
        <Container className="flex h-10 items-center justify-between gap-3 text-xs">
          <a
            href={site.phoneHref}
            className="hidden shrink-0 items-center gap-2 transition-colors hover:text-secondary-fixed sm:flex sm:basis-0 sm:flex-1"
          >
            <Icon name="call" className="text-sm text-secondary-fixed" />
            {site.phone}
          </a>

          <p
            lang="ar"
            dir="rtl"
            title="In the name of Allah, the Most Gracious, the Most Merciful"
            className="min-w-0 flex-1 truncate text-center font-[family-name:var(--font-arabic)] text-base leading-relaxed text-secondary-fixed sm:text-lg"
          >
            بسم الله الرحمن الرحيم
          </p>

          <div className="hidden shrink-0 items-center justify-end gap-3 sm:flex sm:basis-0 sm:flex-1">
            {socialLinks.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="hover:text-secondary-fixed"
              >
                <Icon name={s.icon} className="text-sm" />
              </a>
            ))}
          </div>
        </Container>
      </div>

      {/* Main nav (sticks to top on scroll) */}
      <nav className="sticky top-0 z-50 border-b border-outline-variant/60 bg-surface/95 shadow-sm backdrop-blur-md">
        <Container className="flex items-center justify-between py-3.5">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/546cf85e-7042-499d-ba1f-b16d10355d92.jpeg"
              alt="Sasta Travel Express"
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 rounded-full object-cover"
            />
            <span className="flex flex-col leading-none">
              <span className="text-lg font-extrabold tracking-tight text-on-surface">
                Sasta Travel
              </span>
              <span className="text-[0.6rem] font-semibold uppercase tracking-[0.35em] text-secondary">
                Express
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-6 lg:flex">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "text-sm font-medium uppercase tracking-wide transition-colors",
                  isActive(item.href)
                    ? "text-secondary"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/contact"
              className="hidden rounded-lg bg-secondary-fixed px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 lg:inline-flex"
            >
              Enquire Now
            </Link>
            <button
              type="button"
              aria-label="Toggle menu"
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-on-surface lg:hidden"
            >
              <Icon name={open ? "close" : "menu"} className="text-3xl" />
            </button>
          </div>
        </Container>

        {/* Mobile menu */}
        <div
          className={clsx(
            "overflow-hidden border-t border-outline-variant/60 bg-surface transition-[max-height] duration-300 lg:hidden",
            open ? "max-h-[32rem]" : "max-h-0",
          )}
        >
          <Container className="flex flex-col py-2">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "border-b border-outline-variant/40 py-3 text-sm font-medium uppercase tracking-wide",
                  isActive(item.href) ? "text-secondary" : "text-on-surface-variant",
                )}
              >
                {item.label}
              </Link>
            ))}
            <a
              href={site.whatsappHref}
              className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-secondary-fixed px-6 py-3 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed"
            >
              <Icon name="chat" className="text-base" /> Chat on WhatsApp
            </a>
          </Container>
        </div>
      </nav>
    </header>
  );
}
