"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { mainNav, site } from "@/data/site";

const socials = [
  { icon: "public", href: site.social.facebook, label: "Facebook" },
  { icon: "photo_camera", href: site.social.instagram, label: "Instagram" },
  { icon: "smart_display", href: site.social.youtube, label: "YouTube" },
];

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="relative z-50">
      {/* Top utility bar */}
      <div className="bg-tertiary text-on-tertiary/80">
        <Container className="flex h-9 items-center justify-between text-xs">
          <a
            href={site.phoneHref}
            className="hidden items-center gap-2 transition-colors hover:text-secondary-fixed sm:flex"
          >
            <Icon name="call" className="text-sm text-secondary-fixed" />
            {site.phone}
          </a>
          <p className="flex items-center gap-2 text-center">
            <span className="font-semibold text-secondary-fixed">20% Off</span>
            <span className="hidden sm:inline">Your Next Trip — Hurry up for your new tour!</span>
            <Link href="/" className="font-semibold underline hover:text-secondary-fixed">
              Book Now
            </Link>
          </p>
          <div className="hidden items-center gap-3 sm:flex">
            {socials.map((s) => (
              <a key={s.label} href={s.href} aria-label={s.label} className="hover:text-secondary-fixed">
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
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-secondary-fixed">
              <Icon name="mosque" className="text-2xl" />
            </span>
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
