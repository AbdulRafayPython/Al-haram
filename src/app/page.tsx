import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { PackageCard } from "@/components/packages/PackageCard";
import { packages, packageStats, testimonials } from "@/data/packages";
import { visas } from "@/data/visas";
import { stats, site } from "@/data/site";
import { formatNumber, formatPkr } from "@/lib/format";

const services = [
  {
    icon: "flight_class",
    title: "Umrah Packages",
    desc: "Live departure board with airlines, hotels, seats, and rates.",
    href: "/umrah-packages",
  },
  {
    icon: "hotel",
    title: "Makkah & Madinah Hotels",
    desc: "Compare 60+ hotels by distance from Haram and room rates.",
    href: "/saudi-hotels",
  },
  {
    icon: "airport_shuttle",
    title: "Saudi Transport",
    desc: "Airport transfers, ziyarat routes, and intercity transport.",
    href: "/saudi-transport",
  },
  {
    icon: "calculate",
    title: "Package Calculator",
    desc: "Estimate visa and hotel costs in SAR and PKR instantly.",
    href: "/calculator",
  },
];

const features = [
  { icon: "live_tv", title: "Live Package Board", desc: "Browse real-time seat availability across all departure cities." },
  { icon: "apartment", title: "Hotels Near Haramain", desc: "Transparent comparison of distance, room types, and rates." },
  { icon: "menu_book", title: "Clear Travel Guidance", desc: "Plain explanations of packages, visas, and requirements." },
  { icon: "support_agent", title: "Dedicated Support", desc: "Consultants stay available from first enquiry to departure." },
  { icon: "description", title: "Visa & Documentation", desc: "Processing assistance that reduces delays and confusion." },
  { icon: "verified", title: "Trusted Partners", desc: "Established airlines, hotels, and ground service providers." },
];

export default function HomePage() {
  const featured = packages.filter((p) => p.featured).slice(0, 3);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden bg-primary text-on-primary">
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]">
          <Icon name="mosque" className="absolute -right-16 top-10 text-[420px]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-container" />
        <Container className="relative z-10 flex flex-col items-center py-28 text-center md:py-36">
          <span className="mb-5 text-sm uppercase tracking-[0.3em] text-secondary-fixed">
            Embark on a Sacred Journey
          </span>
          <h1 className="max-w-4xl font-[var(--font-heading)] text-4xl leading-tight md:text-6xl">
            Premium Umrah Journeys
            <br />
            <span className="font-light italic text-secondary-fixed">Crafted from Pakistan</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-on-primary/75">
            {site.description}
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button href="/umrah-packages" variant="gold" size="lg">
              <Icon name="search" className="text-lg" /> View Live Packages
            </Button>
            <Button href="/calculator" size="lg" className="border border-on-primary/30 bg-transparent text-on-primary hover:bg-on-primary/10">
              <Icon name="calculate" className="text-lg" /> Cost Calculator
            </Button>
          </div>

          {/* Quick stats */}
          <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-on-primary/15 bg-on-primary/10 md:grid-cols-4">
            {[
              { value: formatNumber(packageStats.departures), label: "Departures" },
              { value: formatNumber(packageStats.seatsAvailable), label: "Seats Open" },
              { value: "60+", label: "Hotels" },
              { value: "100", label: "Transport Routes" },
            ].map((s) => (
              <div key={s.label} className="bg-primary px-4 py-6">
                <p className="font-[var(--font-heading)] text-2xl text-secondary-fixed md:text-3xl">
                  {s.value}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-on-primary/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Services ---------------- */}
      <section className="py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="How We Help"
              title="Everything for Your Pilgrimage"
              description="Four simple steps from planning to departure — explore packages, choose a hotel, arrange transport, and estimate your costs."
            />
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {services.map((s, i) => (
              <Reveal key={s.title} delay={i * 80}>
                <Link
                  href={s.href}
                  className="group flex h-full flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 transition-all hover:-translate-y-1 hover:border-secondary/40 hover:shadow-xl"
                >
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-surface-container transition-colors group-hover:bg-secondary-container">
                    <Icon name={s.icon} className="text-3xl text-secondary" />
                  </div>
                  <h3 className="font-[var(--font-heading)] text-xl text-primary">{s.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                    {s.desc}
                  </p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold uppercase tracking-wider text-secondary">
                    Explore
                    <Icon name="arrow_forward" className="text-base transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Featured packages ---------------- */}
      <section className="bg-tertiary-fixed py-20 md:py-28">
        <Container>
          <Reveal>
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <SectionHeading
                eyebrow="Live Availability"
                title="Featured Umrah Packages"
                description="A snapshot of our most popular departures. Browse the full board for every city, airline, and hotel combination."
              />
              <Button href="/umrah-packages" variant="secondary">
                View All Packages
                <Icon name="arrow_forward" className="text-base" />
              </Button>
            </div>
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((pkg, i) => (
              <Reveal key={pkg.id} delay={i * 80}>
                <PackageCard pkg={pkg} />
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Why choose us ---------------- */}
      <section className="py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="The Sacred Promise"
              title="Your Trusted Gateway to the Haram"
              description="With 15 years of specialized experience, we combine transparent dealings with personalized care that honors the sanctity of your journey."
            />
          </Reveal>

          {/* Stat strip */}
          <div className="mt-14 grid grid-cols-2 gap-6 rounded-2xl bg-primary p-8 text-center text-on-primary md:grid-cols-4 md:p-12">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-[var(--font-heading)] text-3xl text-secondary-fixed md:text-4xl">
                  {s.value}
                  <span className="text-2xl">{s.suffix}</span>
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-on-primary/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="flex gap-4 rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-6">
                  <Icon name={f.icon} className="mt-0.5 text-2xl text-secondary" />
                  <div>
                    <h4 className="font-semibold uppercase tracking-wide text-primary">
                      {f.title}
                    </h4>
                    <p className="mt-1 text-sm leading-relaxed text-on-surface-variant">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Visa strip ---------------- */}
      <section className="bg-surface-container-low py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Seamless Documentation"
              title="Umrah Visa Services"
              description="Saudi e-visas processed in about 7 days, with taxes included per person. Choose the validity that fits your journey."
            />
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {visas.map((v, i) => (
              <Reveal key={v.id} delay={i * 80}>
                <div className="flex h-full flex-col items-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
                    <Icon name="mosque" className="text-2xl text-secondary" />
                  </div>
                  <p className="text-sm uppercase tracking-widest text-secondary">
                    {v.validityDays} Days
                  </p>
                  <p className="mt-3 font-[var(--font-heading)] text-3xl text-primary">
                    {formatPkr(v.pricePkr)}
                  </p>
                  <p className="mt-1 text-xs text-on-surface-variant">{v.note}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Button href="/visas" variant="secondary">
              All Visa Services <Icon name="arrow_forward" className="text-base" />
            </Button>
          </div>
        </Container>
      </section>

      {/* ---------------- Testimonials ---------------- */}
      <section className="py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Pilgrim Stories"
              title="Trusted by Thousands of Travelers"
            />
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <Reveal key={t.name} delay={i * 60}>
                <figure className="flex h-full flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-7">
                  <div className="mb-4 flex gap-0.5 text-secondary">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Icon key={idx} name="star" className="text-lg" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-relaxed text-on-surface-variant">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center justify-between border-t border-outline-variant/40 pt-4">
                    <span className="font-semibold text-primary">{t.name}</span>
                    <span className="text-xs text-on-surface-variant">{t.date}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden bg-primary py-20 md:py-24">
        <div className="pointer-events-none absolute right-0 top-0 opacity-10">
          <Icon name="flare" className="text-[360px] text-secondary-fixed" />
        </div>
        <Container className="relative z-10 text-center">
          <SectionHeading
            align="center"
            tone="light"
            title="Begin Your Spiritual Journey Today"
            description="Speak with our dedicated consultants to craft a pilgrimage that honors your intentions and travel preferences."
          />
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <Button href="/contact" variant="gold" size="lg">
              <Icon name="call" className="text-lg" /> Contact a Consultant
            </Button>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-on-primary/30 px-9 py-4 text-sm font-semibold uppercase tracking-widest text-on-primary transition-all hover:bg-on-primary/10"
            >
              <Icon name="chat" className="text-lg" /> Chat on WhatsApp
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
