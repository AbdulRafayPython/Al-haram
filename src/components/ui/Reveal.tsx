"use client";

import { useEffect, useRef, useState } from "react";
import { clsx } from "@/lib/clsx";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  /** Delay in ms before the element animates in once visible. */
  delay?: number;
}

/** Fades + lifts children into view on scroll. Respects reduced-motion via CSS. */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={clsx("reveal", visible && "is-visible", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
