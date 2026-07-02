import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { clsx } from "@/lib/clsx";
import { site } from "@/data/site";

// Positions are relative to the Kaaba zone (the lower band), so the badges
// always flank the render regardless of the section's overall height.
const badges = [
  { icon: "confirmation_number", label: "Easy to Book", position: "left-[3%] top-[20%] lg:left-[13%] xl:left-[19%]" },
  { icon: "hotel_class", label: "Best Facilities", position: "right-[3%] top-[20%] lg:right-[13%] xl:right-[19%]" },
  { icon: "verified", label: "Officially Certified", position: "left-[6%] top-[64%] lg:left-[17%] xl:left-[23%]" },
  { icon: "lock", label: "Secure Payment", position: "right-[6%] top-[64%] lg:right-[17%] xl:right-[23%]" },
];

/**
 * Dark, image-led landing hero. The heading sits at the top; below it, the Kaaba
 * render is the large focal point in its own band, with feature badges floating
 * around it. Splitting text and image into stacked zones keeps them from ever
 * overlapping while letting the render stay big.
 */
export function Hero() {
  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-[#0d0d0e]">
      {/* Subtle geometric texture across the whole hero */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(225deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(45deg, rgba(255,255,255,0.4) 25%, transparent 25%), linear-gradient(315deg, rgba(255,255,255,0.4) 25%, transparent 25%)",
          backgroundPosition: "14px 0, 14px 0, 0 0, 0 0",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Text block — top of the hero */}
      <Container className="relative z-10 flex flex-col items-center pt-12 text-center md:pt-14">
        <span className="inline-flex items-center gap-2 rounded-full border border-outline-variant/50 bg-surface-container-lowest/80 px-4 py-1.5 text-xs font-semibold text-on-surface-variant backdrop-blur-sm">
          <Icon name="schedule" className="text-sm text-secondary" />
          Support Available {site.hours}
        </span>

        <h1 className="mt-5 max-w-3xl font-[var(--font-display)] text-3xl font-extrabold leading-[1.12] text-on-surface [text-shadow:0_4px_24px_rgb(0_0_0_/_60%)] md:text-4xl lg:text-5xl">
          Guiding Your Steps to a Peaceful{" "}
          <span className="text-secondary">Hajj &amp; Umrah</span>
        </h1>

        <p className="mt-4 max-w-xl text-base leading-relaxed text-on-surface-variant">
          Experience comfort, clarity, and guidance throughout your spiritual journey —
          from visas and flights to hotels near the Haramain.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button href="/" variant="gold" size="md">
            <Icon name="search" className="text-lg" /> View Live Packages
          </Button>
          <Button href="/calculator" variant="secondary" size="md">
            <Icon name="calculate" className="text-lg" /> Cost Calculator
          </Button>
        </div>

        {/* Feature badges (mobile — floating placement has no room) */}
        <div className="mx-auto mt-8 grid w-full max-w-md grid-cols-2 gap-3 md:hidden">
          {badges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 rounded-full border border-outline-variant/40 bg-surface-container-lowest/85 px-3.5 py-2 text-xs font-semibold text-on-surface backdrop-blur-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
                <Icon name={b.icon} className="text-sm" />
              </span>
              {b.label}
            </div>
          ))}
        </div>
      </Container>

      {/* Kaaba focal band — sits below the text so the two never overlap.
          The render has a transparent background, so it composites cleanly. */}
      <div className="relative mt-2 h-[250px] w-full sm:h-[300px] md:mt-0 md:h-[360px] lg:h-[430px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/kaaba-hero.png"
          alt="A stylized render of the Holy Kaaba in Makkah"
          className="pointer-events-none absolute bottom-0 left-1/2 h-[128%] w-auto max-w-none -translate-x-1/2 object-contain object-bottom"
        />

        {/* Feature badges — flank the Kaaba on wider screens */}
        {badges.map((b) => (
          <FloatingBadge
            key={b.label}
            icon={b.icon}
            label={b.label}
            className={clsx("hidden md:flex", b.position)}
          />
        ))}
      </div>
    </section>
  );
}

function FloatingBadge({
  icon,
  label,
  className,
}: {
  icon: string;
  label: string;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "absolute z-20 -translate-y-1/2 items-center gap-2.5 whitespace-nowrap rounded-full border border-outline-variant/40 bg-surface-container-lowest/90 px-4 py-2.5 text-sm font-semibold text-on-surface shadow-xl backdrop-blur-sm",
        className,
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-on-secondary">
        <Icon name={icon} className="text-base" />
      </span>
      {label}
    </div>
  );
}
