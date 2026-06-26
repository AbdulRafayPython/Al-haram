import Link from "next/link";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost" | "gold";

const base =
  "inline-flex items-center justify-center gap-2 rounded-lg font-[var(--font-body)] text-sm font-semibold uppercase tracking-widest transition-all disabled:opacity-50 disabled:pointer-events-none";

const sizes = {
  md: "px-7 py-3.5",
  lg: "px-9 py-4",
  sm: "px-5 py-2.5 text-xs",
};

const variants: Record<Variant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-container shadow-sm",
  secondary:
    "border border-secondary text-secondary hover:bg-secondary hover:text-on-secondary",
  gold: "bg-secondary-fixed text-on-secondary-fixed hover:brightness-105 shadow-sm",
  ghost: "text-primary hover:bg-surface-container-low",
};

interface CommonProps {
  variant?: Variant;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
}

type ButtonAsLink = CommonProps & { href: string };
type ButtonAsButton = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "md", className, children, ...rest } = props;
  const classes = clsx(base, sizes[size], variants[variant], className);

  if ("href" in rest && rest.href) {
    return (
      <Link href={rest.href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={classes}
      {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {children}
    </button>
  );
}
