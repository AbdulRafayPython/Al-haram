import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Accordion } from "@/components/ui/Accordion";
import { clsx } from "@/lib/clsx";
import { formatPkr } from "@/lib/format";
import { visas, visaFaqs, visaTypes } from "@/data/visas";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Visa Services",
  description:
    "Saudi Umrah e-visa processing with 20, 28, and 80 day options, plus Hajj, Tour, and Visa on Arrival assistance.",
};

const steps = [
  { icon: "edit_document", title: "Submit Details", desc: "Share passport and traveler details in English. We review for completeness." },
  { icon: "fact_check", title: "We Process", desc: "Our team submits your e-visa application and tracks it for you." },
  { icon: "mark_email_read", title: "Confirmation", desc: "You receive a Visa Application ID and confirmation by email." },
  { icon: "verified_user", title: "Visa Issued", desc: "Approved e-visa delivered, typically within 7 days." },
];

export default function VisasPage() {
  return (
    <>
      <PageHeader
        eyebrow="Seamless Documentation"
        title="Visa Services"
        description="From Umrah e-visas to Hajj and tour visas, our documentation team keeps the process clear and on time."
        icon="description"
      />

      {/* Visa type overview */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Categories"
            title="Which Visa Do You Need?"
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {visaTypes.map((v) => (
              <div
                key={v.type}
                className="flex flex-col rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-7"
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-secondary-container">
                  <Icon name={v.icon} className="text-2xl text-secondary" />
                </div>
                <h3 className="font-[var(--font-heading)] text-xl text-primary">{v.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-on-surface-variant">
                  {v.blurb}
                </p>
                <span
                  className={clsx(
                    "mt-4 inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider",
                    v.available
                      ? "bg-success/10 text-success"
                      : "bg-surface-container text-on-surface-variant",
                  )}
                >
                  <Icon name={v.available ? "check_circle" : "schedule"} className="text-base" />
                  {v.available ? "Available Now" : "On Request"}
                </span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Umrah visa pricing */}
      <section className="bg-tertiary-fixed py-14 md:py-20">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="Umrah E-Visa"
            title="Transparent Visa Pricing"
            description="Prices are per person with taxes included. Standard processing is around 7 days."
          />
          <div className="mx-auto mt-12 grid max-w-4xl grid-cols-1 gap-6 sm:grid-cols-3">
            {visas.map((v, i) => (
              <div
                key={v.id}
                className={clsx(
                  "relative flex flex-col rounded-xl border bg-surface-container-lowest p-8 text-center",
                  i === 1
                    ? "border-secondary shadow-lg"
                    : "border-outline-variant/40",
                )}
              >
                {i === 1 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-secondary px-4 py-1 text-xs font-semibold uppercase tracking-wider text-on-secondary">
                    Most Popular
                  </span>
                )}
                <p className="text-sm uppercase tracking-widest text-secondary">
                  {v.validityDays} Days Validity
                </p>
                <p className="mt-4 font-[var(--font-heading)] text-4xl text-primary">
                  {formatPkr(v.pricePkr)}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">{v.note}</p>
                <ul className="mt-6 space-y-3 text-left text-sm">
                  <Bullet>{v.mode} — Saudi Arabia</Bullet>
                  <Bullet>~{v.processingDays} day processing</Bullet>
                  <Bullet>Documentation support included</Bullet>
                </ul>
                <Button
                  href={`${site.whatsappHref}?text=I'd like the ${v.validityDays}-day Umrah visa`}
                  variant={i === 1 ? "primary" : "secondary"}
                  className="mt-8"
                >
                  Apply Now
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Process steps */}
      <section className="py-14 md:py-20">
        <Container>
          <SectionHeading
            align="center"
            eyebrow="The Process"
            title="Four Simple Steps"
            description="A clear, guided path from your first enquiry to an approved visa."
          />
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="relative rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-7">
                <span className="absolute right-5 top-5 font-[var(--font-heading)] text-4xl text-surface-container">
                  0{i + 1}
                </span>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                  <Icon name={s.icon} className="text-2xl text-secondary-fixed" />
                </div>
                <h3 className="font-semibold text-primary">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* FAQ */}
      <section className="bg-surface-container-low py-14 md:py-20">
        <Container className="max-w-3xl">
          <SectionHeading
            align="center"
            eyebrow="Good to Know"
            title="Visa Application FAQ"
          />
          <div className="mt-12">
            <Accordion items={visaFaqs} />
          </div>
        </Container>
      </section>
    </>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-on-surface-variant">
      <Icon name="check" className="mt-0.5 text-base text-success" />
      <span>{children}</span>
    </li>
  );
}
