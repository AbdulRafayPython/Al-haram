import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { BoardCard } from "@/components/home/BoardCard";
import { Hero } from "@/components/home/Hero";
import { BlendImage } from "@/components/ui/BlendImage";
import { getAllAirlines } from "@/lib/data/airlines";
import { getVisas } from "@/lib/data/visas";
import { getTestimonials } from "@/lib/data/testimonials";
import { stats, site } from "@/data/site";
import { formatPkr } from "@/lib/format";

export const metadata: Metadata = {
  title: "Home",
  description: site.description,
};

const boards = [
  {
    pillIcon: "dashboard",
    pillLabel: "Umrah package board",
    icon: "flight_class",
    title: "Umrah Packages",
    description:
      "Browse our live package board for routes from Pakistan, departure dates, airline options, hotel combinations, seat status, and current package rates.",
    buttonLabel: "View Packages",
    href: "/",
    image: "/images/kaaba.jpg",
  },
  {
    pillIcon: "location_on",
    pillLabel: "Saudi hotel board",
    icon: "hotel",
    title: "Makkah and Madinah Hotels",
    description:
      "Browse selected Makkah and Madinah stays with location, distance from Haram, room rates, images, and map details — all in one place.",
    buttonLabel: "View Hotels",
    href: "/saudi-hotels",
    image: "/images/makkah-skyline.jpg",
  },
  {
    pillIcon: "route",
    pillLabel: "Saudi transport rates",
    icon: "airport_shuttle",
    title: "Saudi Transport",
    description:
      "Browse airport transfers, hotel transfers, railway connections, and ziyarat routes by vehicle occupancy and current route rates.",
    buttonLabel: "View Transport",
    href: "/saudi-transport",
    image: "/images/transport.jpg",
  },
  {
    pillIcon: "calculate",
    pillLabel: "Umrah cost estimator",
    icon: "calculate",
    title: "Umrah Package Calculator",
    description:
      "Estimate visa and hotel costs from current rates, compare Makkah and Madinah stay options, and prepare a clearer Umrah budget before booking.",
    buttonLabel: "Calculate Package",
    href: "/calculator",
    image: "/images/madinah.jpg",
  },
];

const features = [
  { icon: "dashboard", accent: "gold", title: "Live Umrah Package Board", desc: "Browse current availability with routes, airline sectors, travel dates, seat status, and rates in one focused board." },
  { icon: "apartment", accent: "green", title: "Makkah & Madinah Hotels", desc: "Compare Saudi hotels by location, distance from Haram, room rates, and images to choose stays with confidence." },
  { icon: "menu_book", accent: "gold", title: "Clear Travel Guidance", desc: "We explain package inclusions, visa requirements, hotel choices, and timings in simple language before you book." },
  { icon: "support_agent", accent: "green", title: "Dedicated Support", desc: "From first enquiry to final departure, our consultants stay available for selection, documents, and updates." },
  { icon: "description", accent: "gold", title: "Visa & Documentation", desc: "Processing assistance that reduces delays and keeps your application moving on time." },
  { icon: "verified", accent: "green", title: "Trusted Travel Partners", desc: "We work with established airlines, hotels, and ground-service providers across the journey." },
];

export default async function HomePage() {
  const [visas, testimonials, airlines] = await Promise.all([
    getVisas(),
    getTestimonials(),
    getAllAirlines(),
  ]);

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <Hero />

      {/* ---------------- Partners ---------------- */}
      {airlines.length > 0 && (
        <section className="bg-surface-container-low py-10 md:py-12">
          <Container>
            <p className="mb-7 text-center text-xs font-semibold uppercase tracking-[0.3em] text-on-surface-variant">
              Trusted Airline &amp; Travel Partners
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 md:gap-x-14">
              {airlines.map((a) =>
                a.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={a.id}
                    src={a.logoUrl}
                    alt={a.name}
                    className="h-9 w-auto object-contain opacity-60 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 md:h-10"
                  />
                ) : (
                  <span
                    key={a.id}
                    className="text-lg font-bold tracking-tight text-on-surface-variant/60 grayscale transition-all duration-300 hover:text-secondary hover:grayscale-0 md:text-xl"
                  >
                    {a.name}
                  </span>
                ),
              )}
            </div>
          </Container>
        </section>
      )}

      {/* ---------------- Intro ---------------- */}
      <section className="bg-surface py-16 md:py-24">
        <Container className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-7">
            <span className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-secondary">
              <span className="h-px w-8 bg-secondary" /> Umrah Travel Services
            </span>
            <h2 className="font-[var(--font-display)] text-4xl font-extrabold leading-[1.1] text-on-surface md:text-5xl">
              Umrah Packages from Pakistan with Makkah &amp; Madinah hotel options
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-on-surface-variant">
              Plan your Umrah journey with current departure seats, airline sectors,
              package rates, and carefully selected hotels near the Haramain in
              Makkah and Madinah.
            </p>
          </div>
          <div className="lg:col-span-5">
            <a
              href={site.phoneHref}
              className="flex items-center gap-4 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 transition-colors hover:border-secondary/40"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-secondary-container text-secondary">
                <Icon name="call" className="text-2xl" />
              </span>
              <span>
                <span className="block text-xs uppercase tracking-wider text-on-surface-variant">
                  24/7 Consultant
                </span>
                <span className="text-lg font-bold text-on-surface">{site.phone}</span>
              </span>
            </a>
          </div>
        </Container>
      </section>

      {/* ---------------- Board cards ---------------- */}
      <section className="bg-surface pb-16 md:pb-24">
        <Container className="space-y-6">
          {boards.map((b, i) => (
            <Reveal key={b.title} delay={i * 60}>
              <BoardCard {...b} />
            </Reveal>
          ))}
        </Container>
      </section>

      {/* ---------------- Why choose ---------------- */}
      <section className="py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Our Success"
              title="Why Choose Sasta Travel Express"
            />
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className="group flex h-full gap-5 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-7 transition-all hover:-translate-y-1 hover:shadow-lg">
                  <div
                    className={
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl " +
                      (f.accent === "gold"
                        ? "bg-secondary-container text-secondary"
                        : "bg-success/10 text-success")
                    }
                  >
                    <Icon name={f.icon} className="text-3xl" />
                  </div>
                  <div>
                    <h3 className="font-[var(--font-heading)] text-lg font-bold text-on-surface">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Trust stats */}
          <div className="mt-12 grid grid-cols-2 gap-6 rounded-2xl bg-primary p-8 text-center text-on-primary md:grid-cols-4 md:p-10">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-[var(--font-heading)] text-3xl font-extrabold text-secondary-fixed md:text-4xl">
                  {s.value}
                  <span className="text-2xl">{s.suffix}</span>
                </p>
                <p className="mt-1 text-xs uppercase tracking-wider text-on-primary/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- Visa processing ---------------- */}
      <section className="bg-surface-container-low py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Documentation"
              title="Visa Processing"
              description="Saudi e-visas processed in about 7 days, with taxes included per person. Choose the validity that fits your journey."
            />
          </Reveal>
          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {visas.map((v, i) => (
              <Reveal key={v.id} delay={i * 80}>
                <div className="flex h-full flex-col items-center rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-8 text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
                    <Icon name="mosque" className="text-2xl text-secondary" />
                  </div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-secondary">
                    {v.validityDays} Days
                  </p>
                  <p className="mt-3 font-[var(--font-heading)] text-3xl font-extrabold text-on-surface">
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
      <section className="bg-tertiary-fixed py-20 md:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              align="center"
              eyebrow="Testimonial"
              title="Regards From Travelers"
            />
          </Reveal>
          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {testimonials.slice(0, 6).map((t, i) => (
              <Reveal key={t.name} delay={i * 60}>
                <figure className="flex h-full flex-col rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-7">
                  <div className="mb-4 flex gap-0.5 text-secondary">
                    {Array.from({ length: t.rating }).map((_, idx) => (
                      <Icon key={idx} name="star" className="text-lg" />
                    ))}
                  </div>
                  <blockquote className="flex-1 text-sm leading-relaxed text-on-surface-variant">
                    “{t.quote}”
                  </blockquote>
                  <figcaption className="mt-5 flex items-center justify-between border-t border-outline-variant/60 pt-4">
                    <span className="font-bold text-on-surface">{t.name}</span>
                    <span className="text-xs text-on-surface-variant">{t.date}</span>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>

      {/* ---------------- CTA ---------------- */}
      <section className="relative overflow-hidden bg-primary py-16 md:py-20">
        <BlendImage src="/images/pilgrims.jpg" variant="card" position="object-top" />
        <Container className="relative z-10 flex flex-col items-center justify-between gap-8 text-center md:flex-row md:text-left">
          <div>
            <span className="mb-3 block font-[var(--font-script)] text-2xl text-secondary-fixed">
              Ready when you are
            </span>
            <h2 className="font-[var(--font-heading)] text-3xl font-extrabold text-on-primary md:text-4xl">
              Want to Take Tour Packages?
            </h2>
            <p className="mt-3 max-w-xl text-on-primary/70">
              Speak with our consultants to craft a pilgrimage that fits your intentions,
              dates, and budget.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-4 sm:flex-row">
            <Button href="/" variant="gold" size="lg">
              View Umrah Packages
            </Button>
            <a
              href={site.whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-on-primary/30 px-8 py-4 text-sm font-bold uppercase tracking-widest text-on-primary transition-all hover:bg-on-primary/10"
            >
              <Icon name="chat" className="text-lg" /> WhatsApp
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}
