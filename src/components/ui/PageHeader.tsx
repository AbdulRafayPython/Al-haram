import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { BlendImage } from "@/components/ui/BlendImage";
import { clsx } from "@/lib/clsx";

type BlendVariant = "card" | "hero" | "photo" | "tint" | "night";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: string;
  /** Optional blended background photo for the hero band. */
  image?: string;
  /** Scrim style for the background photo (default a centered navy tint). */
  imageVariant?: BlendVariant;
  /** Tailwind object-position for the photo, e.g. "object-right". */
  imagePosition?: string;
  /** Text alignment. "left" gives a taller banner that showcases the photo. */
  align?: "center" | "left";
  /** Tighter padding + smaller type so below-the-fold content needs less scrolling. */
  compact?: boolean;
}

/** Consistent dark hero band at the top of every inner page. */
export function PageHeader({
  eyebrow,
  title,
  description,
  icon,
  image,
  imageVariant = "hero",
  imagePosition = "object-center",
  align = "center",
  compact,
}: PageHeaderProps) {
  const left = align === "left";

  return (
    <section
      className={clsx(
        "relative overflow-hidden bg-primary text-on-primary",
        // A left-aligned banner gets a bit of extra height so the photo reads,
        // but stays compact enough to keep the filters below in view.
        left && "flex items-center min-h-[160px] md:min-h-[190px]",
      )}
    >
      {image ? (
        <BlendImage src={image} variant={imageVariant} position={imagePosition} />
      ) : (
        <>
          {icon && (
            <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
              <Icon name={icon} className="absolute -right-10 -top-6 text-[300px]" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-container" />
        </>
      )}
      <Container
        className={clsx(
          "relative z-10 w-full",
          compact ? "py-8 md:py-10" : "py-20 md:py-24",
          left ? "text-left" : "text-center",
        )}
      >
        {eyebrow && (
          <span
            className={clsx(
              "block uppercase tracking-[0.3em] text-secondary-fixed",
              compact ? "mb-2 text-xs" : "mb-4 text-sm",
            )}
          >
            {eyebrow}
          </span>
        )}
        <h1
          className={clsx(
            "font-[var(--font-display)] font-extrabold leading-tight tracking-tight",
            left ? "max-w-2xl [text-shadow:0_2px_16px_rgb(0_0_0_/_55%)]" : "mx-auto max-w-3xl",
            compact ? "text-2xl md:text-3xl" : "text-4xl md:text-5xl",
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={clsx(
              "text-on-primary/75",
              left ? "max-w-xl [text-shadow:0_2px_12px_rgb(0_0_0_/_65%)]" : "mx-auto max-w-2xl",
              compact ? "mt-2 text-sm" : "mt-5 text-lg",
            )}
          >
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
