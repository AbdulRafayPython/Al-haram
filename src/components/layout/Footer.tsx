import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { mainNav, site } from "@/data/site";

export function Footer() {
  return (
    <footer className="bg-tertiary text-on-tertiary">
      <Container className="grid grid-cols-1 gap-12 py-20 md:grid-cols-12">
        <div className="md:col-span-5">
          <div className="mb-5 text-2xl font-bold text-secondary-fixed">
            Haram Gateway Express
          </div>
          <p className="mb-8 max-w-sm text-sm leading-relaxed text-on-tertiary/75">
            Your trusted partner for Hajj, Umrah, and international travel. We
            offer visa processing, flight bookings, hotel stays, Saudi transport,
            and personalized pilgrimage packages from Pakistan.
          </p>
          <div className="flex gap-3">
            {[
              { icon: "public", href: site.social.facebook, label: "Facebook" },
              { icon: "photo_camera", href: site.social.instagram, label: "Instagram" },
              { icon: "work", href: site.social.linkedin, label: "LinkedIn" },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-on-tertiary/20 text-on-tertiary transition-colors hover:border-secondary-fixed hover:text-secondary-fixed"
              >
                <Icon name={s.icon} className="text-base" />
              </a>
            ))}
          </div>
        </div>

        <div className="md:col-span-3">
          <h6 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-on-tertiary">
            Explore
          </h6>
          <ul className="space-y-3">
            {mainNav.slice(1, 6).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block text-sm text-on-tertiary/75 transition-all hover:translate-x-1 hover:text-secondary-fixed"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:col-span-4">
          <h6 className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-on-tertiary">
            Get in Touch
          </h6>
          <p className="mb-2 text-sm text-on-tertiary/75">{site.address}</p>
          <p className="mb-5 text-sm text-on-tertiary/75">{site.hours}</p>
          <a
            href={site.phoneHref}
            className="mb-2 block text-xl font-semibold text-secondary-fixed"
          >
            {site.phone}
          </a>
          <a
            href={site.emailHref}
            className="text-sm text-on-tertiary/60 transition-colors hover:text-on-tertiary"
          >
            {site.email}
          </a>
        </div>
      </Container>

      <div className="border-t border-on-tertiary/10">
        <Container className="flex flex-col items-center justify-between gap-4 py-6 md:flex-row">
          <p className="text-xs text-on-tertiary/40">
            © {new Date().getFullYear()} Haram Gateway Express. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/visas" className="text-xs uppercase tracking-widest text-on-tertiary/40 hover:text-on-tertiary">
              Privacy Policy
            </Link>
            <Link href="/visas" className="text-xs uppercase tracking-widest text-on-tertiary/40 hover:text-on-tertiary">
              Terms &amp; Conditions
            </Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}
