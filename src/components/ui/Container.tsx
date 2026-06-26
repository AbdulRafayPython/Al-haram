import { clsx } from "@/lib/clsx";

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

/** Centered max-width wrapper with responsive horizontal padding. */
export function Container({ children, className }: ContainerProps) {
  return (
    <div className={clsx("mx-auto w-full max-w-[1280px] px-5 md:px-12 lg:px-20", className)}>
      {children}
    </div>
  );
}
