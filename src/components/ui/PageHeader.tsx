import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";
import { BlendImage } from "@/components/ui/BlendImage";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: string;
  /** Optional blended background photo for the hero band. */
  image?: string;
  /** Tighter padding + smaller type so below-the-fold content needs less scrolling. */
  compact?: boolean;
}

/** Consistent dark hero band at the top of every inner page. */
export function PageHeader({ eyebrow, title, description, icon, image, compact }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-primary text-on-primary">
      {image ? (
        <BlendImage src={image} variant="hero" position="object-center" />
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
        className={
          compact
            ? "relative z-10 py-8 text-center md:py-10"
            : "relative z-10 py-20 text-center md:py-24"
        }
      >
        {eyebrow && (
          <span
            className={
              compact
                ? "mb-2 block text-xs uppercase tracking-[0.3em] text-secondary-fixed"
                : "mb-4 block text-sm uppercase tracking-[0.3em] text-secondary-fixed"
            }
          >
            {eyebrow}
          </span>
        )}
        <h1
          className={
            compact
              ? "mx-auto max-w-3xl font-[var(--font-display)] text-2xl font-extrabold leading-tight tracking-tight md:text-3xl"
              : "mx-auto max-w-3xl font-[var(--font-display)] text-4xl font-extrabold leading-tight tracking-tight md:text-5xl"
          }
        >
          {title}
        </h1>
        {description && (
          <p
            className={
              compact
                ? "mx-auto mt-2 max-w-2xl text-sm text-on-primary/75"
                : "mx-auto mt-5 max-w-2xl text-lg text-on-primary/75"
            }
          >
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
