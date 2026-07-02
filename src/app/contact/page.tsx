import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { PageHeader } from "@/components/ui/PageHeader";
import { Icon } from "@/components/ui/Icon";
import { ContactForm } from "@/components/contact/ContactForm";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Sasta Travel Express — call, WhatsApp, or visit our Karachi office.",
};

const channels = [
  { icon: "call", label: "Call Us", value: site.phone, href: site.phoneHref, note: "24/7 Travel Consultant" },
  { icon: "chat", label: "WhatsApp", value: "Chat with us", href: site.whatsappHref, note: "Fastest response" },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in Touch"
        title="We're Here to Help"
        description="Speak with our consultants about packages, hotels, visas, or transport. Reach us whichever way is easiest for you."
        icon="contact_support"
        image="/images/kaaba.jpg"
      />

      {/* Channels */}
      <section className="py-14 md:py-20">
        <Container>
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-6 sm:grid-cols-2">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.icon === "chat" ? "_blank" : undefined}
                rel={c.icon === "chat" ? "noopener noreferrer" : undefined}
                className="group flex flex-col items-center rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-8 text-center transition-all hover:-translate-y-1 hover:border-secondary/40 hover:shadow-xl"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-container transition-colors group-hover:bg-secondary group-hover:text-on-secondary">
                  <Icon name={c.icon} className="text-3xl text-secondary group-hover:text-on-secondary" />
                </div>
                <p className="text-xs uppercase tracking-widest text-on-surface-variant">{c.label}</p>
                <p className="mt-2 font-[var(--font-heading)] text-lg text-on-surface">{c.value}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{c.note}</p>
              </a>
            ))}
          </div>
        </Container>
      </section>

      {/* Form + details */}
      <section className="bg-surface-container-low py-14 md:py-20">
        <Container className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px]">
          <div>
            <h2 className="font-[var(--font-heading)] text-2xl text-on-surface md:text-3xl">
              Send Us a Message
            </h2>
            <p className="mt-2 text-sm text-on-surface-variant">
              Fill in the form and we&apos;ll continue the conversation on WhatsApp.
            </p>
            <div className="mt-8">
              <ContactForm />
            </div>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7">
              <h3 className="font-[var(--font-heading)] text-xl text-on-surface">Visit Our Office</h3>
              <ul className="mt-5 space-y-4 text-sm">
                <Detail icon="location_on" label="Address" value={site.address} />
                <Detail icon="schedule" label="Office Hours" value={site.hours} />
                <Detail icon="call" label="Phone" value={site.phone} href={site.phoneHref} />
              </ul>
            </div>
            <div className="flex aspect-video items-center justify-center rounded-2xl border border-outline-variant/40 bg-gradient-to-br from-primary to-primary-container text-on-primary">
              <div className="text-center">
                <Icon name="map" className="text-5xl text-secondary-fixed" />
                <p className="mt-2 text-sm text-on-primary/70">Bahadurabad, Karachi</p>
              </div>
            </div>
          </aside>
        </Container>
      </section>
    </>
  );
}

function Detail({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="block text-xs uppercase tracking-wider text-on-surface-variant">{label}</span>
      <span className="text-on-surface">{value}</span>
    </>
  );
  return (
    <li className="flex gap-3">
      <Icon name={icon} className="mt-0.5 text-xl text-secondary" />
      <div>{href ? <a href={href} className="hover:text-secondary">{content}</a> : content}</div>
    </li>
  );
}
