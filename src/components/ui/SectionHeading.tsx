import { clsx } from "@/lib/clsx";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "dark" | "light";
  className?: string;
}

/** Consistent eyebrow + serif headline + lede used across sections. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "dark",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <span className="mb-4 block text-sm font-semibold uppercase tracking-[0.2em] text-secondary">
          {eyebrow}
        </span>
      )}
      <h2
        className={clsx(
          "text-3xl leading-tight md:text-4xl lg:text-5xl",
          tone === "light" ? "text-on-primary" : "text-on-surface",
        )}
      >
        {title}
      </h2>
      {description && (
        <p
          className={clsx(
            "mt-4 text-lg leading-relaxed",
            tone === "light" ? "text-on-primary/70" : "text-on-surface-variant",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
