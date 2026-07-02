import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { BlendImage } from "@/components/ui/BlendImage";

interface BoardCardProps {
  pillIcon: string;
  pillLabel: string;
  icon: string;
  title: string;
  description: string;
  buttonLabel: string;
  href: string;
  image: string;
}

/**
 * Signature "board" card from the live site: a deep-navy panel with a status
 * pill, a gold icon tile, a bold title + description, and a gold CTA. These
 * stack down the page so visitors immediately see what they can do.
 */
export function BoardCard({
  pillIcon,
  pillLabel,
  icon,
  title,
  description,
  buttonLabel,
  href,
  image,
}: BoardCardProps) {
  return (
    <article className="group relative overflow-hidden rounded-xl bg-primary p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl md:p-9">
      {/* Blended destination photo */}
      <BlendImage src={image} variant="card" />

      <div className="relative z-10">
        {/* Status pill */}
        <span className="inline-flex items-center gap-2 rounded-full border border-on-primary/15 bg-on-primary/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-on-primary/80">
          <Icon name={pillIcon} className="text-sm text-secondary-fixed" />
          {pillLabel}
        </span>

        <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-center">
          {/* Gold icon tile */}
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-on-secondary-fixed shadow-md">
            <Icon name={icon} className="text-3xl" />
          </div>

          {/* Title + description */}
          <div className="flex-1">
            <h3 className="font-[var(--font-heading)] text-2xl font-extrabold leading-tight text-on-primary md:text-3xl">
              {title}
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-on-primary/70">
              {description}
            </p>
          </div>

          {/* CTA */}
          <Link
            href={href}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-secondary-fixed px-7 py-3.5 text-xs font-bold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105"
          >
            {buttonLabel}
            <Icon name="arrow_forward" className="text-base transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </article>
  );
}
