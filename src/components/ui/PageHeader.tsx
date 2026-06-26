import { Container } from "@/components/ui/Container";
import { Icon } from "@/components/ui/Icon";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: string;
}

/** Consistent dark hero band at the top of every inner page. */
export function PageHeader({ eyebrow, title, description, icon }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden bg-primary text-on-primary">
      {icon && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
          <Icon name={icon} className="absolute -right-10 -top-6 text-[300px]" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-container" />
      <Container className="relative z-10 py-20 text-center md:py-24">
        {eyebrow && (
          <span className="mb-4 block text-sm uppercase tracking-[0.3em] text-secondary-fixed">
            {eyebrow}
          </span>
        )}
        <h1 className="mx-auto max-w-3xl font-[var(--font-heading)] text-4xl leading-tight md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mx-auto mt-5 max-w-2xl text-lg text-on-primary/75">
            {description}
          </p>
        )}
      </Container>
    </section>
  );
}
