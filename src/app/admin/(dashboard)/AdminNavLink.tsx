"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";

export function AdminNavLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: string;
  label: string;
}) {
  const pathname = usePathname();
  const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={clsx(
        "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors md:shrink",
        isActive
          ? "bg-secondary-container text-on-secondary-container"
          : "text-on-surface-variant hover:bg-white/5 hover:text-on-surface",
      )}
    >
      <Icon name={icon} className="text-lg" />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
