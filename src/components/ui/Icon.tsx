import { clsx } from "@/lib/clsx";

interface IconProps {
  name: string;
  className?: string;
  /** Optical size / weight tweaks handled via CSS; pass Tailwind text-size classes here. */
}

/** Thin wrapper around Material Symbols Outlined (loaded in the root layout). */
export function Icon({ name, className }: IconProps) {
  return (
    <span className={clsx("material-symbols-outlined", className)} aria-hidden="true">
      {name}
    </span>
  );
}
