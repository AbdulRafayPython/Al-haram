"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { mainNav, site } from "@/data/site";

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-outline-variant/30 bg-surface/85 backdrop-blur-md shadow-sm"
          : "bg-surface/40 backdrop-blur-sm",
      )}
    >
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="flex flex-col leading-none">
          <span className="text-xl font-bold tracking-tight text-primary">
            Haram Gateway
          </span>
          <span className="text-[0.65rem] uppercase tracking-[0.35em] text-secondary">
            Express
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "text-sm transition-colors",
                isActive(item.href)
                  ? "border-b-2 border-secondary pb-1 font-semibold text-primary"
                  : "text-on-surface-variant hover:text-primary",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/contact"
            className="hidden rounded-lg bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container lg:inline-flex"
          >
            Enquire Now
          </Link>
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-primary lg:hidden"
          >
            <Icon name={open ? "close" : "menu"} className="text-3xl" />
          </button>
        </div>
      </Container>

      {/* Mobile menu */}
      <div
        className={clsx(
          "overflow-hidden border-t border-outline-variant/30 bg-surface/95 backdrop-blur-md transition-[max-height] duration-300 lg:hidden",
          open ? "max-h-[28rem]" : "max-h-0",
        )}
      >
        <Container className="flex flex-col py-2">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={clsx(
                "border-b border-outline-variant/20 py-3 text-sm",
                isActive(item.href)
                  ? "font-semibold text-primary"
                  : "text-on-surface-variant",
              )}
            >
              {item.label}
            </Link>
          ))}
          <a
            href={site.whatsappHref}
            className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-xs font-semibold uppercase tracking-widest text-on-primary"
          >
            <Icon name="chat" className="text-base" /> Chat on WhatsApp
          </a>
        </Container>
      </div>
    </header>
  );
}
