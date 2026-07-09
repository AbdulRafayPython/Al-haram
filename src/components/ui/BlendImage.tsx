import { clsx } from "@/lib/clsx";

type BlendVariant = "card" | "hero" | "photo" | "tint" | "night";

/**
 * Scrim applied over the photo so it blends into the brand and keeps overlaid
 * text readable. Each variant tunes how much of the image shows.
 */
const scrims: Record<BlendVariant, string> = {
  // Text sits on the left; photo bleeds in from the right.
  card: "bg-gradient-to-r from-primary via-primary/95 to-primary/55",
  // Centered hero band — even navy tint so large headings stay legible.
  hero: "bg-gradient-to-br from-primary/90 via-primary/72 to-primary/90",
  // Photo is the focus (e.g. hotel header) — navy only along the bottom edge.
  photo: "bg-gradient-to-t from-primary/85 via-primary/10 to-transparent",
  // Barely-there texture behind an otherwise solid navy panel.
  tint: "bg-primary/85",
  // Already-dark night photo — a neutral near-black fade on the left keeps
  // left-aligned text readable while the bright subject on the right shows
  // through untouched (no blue tint).
  night: "bg-gradient-to-r from-background via-background/55 to-transparent",
};

interface BlendImageProps {
  src: string;
  /** How strongly the photo reads through the navy brand colour. */
  variant?: BlendVariant;
  /** Tailwind object-position utility, e.g. "object-top". */
  position?: string;
  className?: string;
}

/**
 * Decorative blended background image. Drop it in as the first child of a
 * `relative overflow-hidden bg-primary` container, then keep the real content
 * in a sibling marked `relative z-10`. If the image ever fails to load, the
 * parent's navy background shows through, so layouts never break.
 */
export function BlendImage({
  src,
  variant = "card",
  position = "object-center",
  className,
}: BlendImageProps) {
  return (
    <div
      aria-hidden
      className={clsx("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        className={clsx(
          "h-full w-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-105",
          position,
        )}
      />
      <div className={clsx("absolute inset-0", scrims[variant])} />
    </div>
  );
}
