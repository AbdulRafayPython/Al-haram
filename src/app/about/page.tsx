import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { BlendImage } from "@/components/ui/BlendImage";
import { stats } from "@/data/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Sasta Travel Express is a Karachi-based travel company specializing in Umrah, Hajj, and international travel with 15 years of experience.",
};

const values = [
  { icon: "handshake", title: "Transparent Dealings", desc: "Honest pricing and clear communication at every stage of your journey." },
  { icon: "shield_person", title: "Reliable Arrangements", desc: "Established partnerships with trusted airlines, hotels, and ground services." },
  { icon: "favorite", title: "Personalized Support", desc: "Care that honors the spiritual significance of your pilgrimage." },
];

const extraStats = [
  { value: "55+", label: "Travel Guides" },
  { value: "5.0", label: "Average Rating" },
  { value: "245k", label: "Reviews" },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Your Trusted Gateway to the Haram"
        description="A Karachi-based travel company dedicated to making your Umrah and Hajj journey peaceful, transparent, and memorable."
        icon="diversity_3"
        image="/images/pilgrims.jpg"
      />

      {/* Mission */}
      <section className="py-16 md:py-24">
        <Container className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
              Our Mission
            </span>
            <h2 className="font-[var(--font-heading)] text-3xl leading-tight text-on-surface md:text-4xl">
              A peaceful Umrah experience that lasts a lifetime
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-on-surface-variant">
              Sasta Travel Express specializes in Umrah services, Hajj arrangements, and
              international tourism. We serve pilgrims across Pakistan with visa processing,
              flight bookings, hotel accommodations, and guided tours.
            </p>
            <p className="mt-4 leading-relaxed text-on-surface-variant">
              We believe in transparent dealings, reliable arrangements, and personalized
              support — delivering a journey that leaves you with lifelong memories and
              spiritual satisfaction.
            </p>
            <Button href="/" className="mt-8">
              Explore Packages <Icon name="arrow_forward" className="text-base" />
            </Button>
          </Reveal>

          <Reveal delay={120}>
            <div className="group relative">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-primary">
                <BlendImage src="/images/kaaba.jpg" variant="photo" position="object-center" />
              </div>
              <div className="absolute -bottom-6 -right-4 rounded-2xl bg-secondary-fixed p-8 text-on-secondary-fixed shadow-xl md:-right-6">
                <p className="font-[var(--font-heading)] text-5xl leading-none">15+</p>
                <p className="mt-1 text-sm uppercase tracking-widest">
                  Years of
                  <br />
                  Trusted Service
                </p>
              </div>
            </div>
          </Reveal>
        </Container>
      </section>

      {/* Stats band */}
      <section className="relative overflow-hidden bg-primary py-16 text-on-primary">
        <BlendImage src="/images/makkah-skyline.jpg" variant="tint" position="object-center" />
        <Container className="relative z-10">
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="font-[var(--font-heading)] text-4xl text-secondary-fixed md:text-5xl">
                  {s.value}
                  <span className="text-3xl">{s.suffix}</span>
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-on-primary/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-12 grid max-w-2xl grid-cols-3 gap-8 border-t border-on-primary/15 pt-12 text-center">
            {extraStats.map((s) => (
              <div key={s.label}>
                <p className="font-[var(--font-heading)] text-3xl text-on-primary">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-on-primary/60">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Values */}
      <section className="py-16 md:py-24">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="What Guides Us"
            title="Our Core Values"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 80}>
                <div className="flex h-full flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center">
                  <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container">
                    <Icon name={v.icon} className="text-3xl text-secondary" />
                  </div>
                  <h3 className="font-[var(--font-heading)] text-xl text-on-surface">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{v.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
