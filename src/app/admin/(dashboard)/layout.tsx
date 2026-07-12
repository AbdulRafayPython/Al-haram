import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/data/site";
import { logoutAdmin } from "@/app/admin/actions";
import { AdminNavLink } from "./AdminNavLink";

const navItems = [
  { href: "/admin", icon: "dashboard", label: "Dashboard" },
  { href: "/admin/packages", icon: "flight_class", label: "Umrah Packages" },
  { href: "/admin/packages/new", icon: "add_circle", label: "Add Package" },
  { href: "/admin/hotels", icon: "apartment", label: "Hotels" },
];

export default function AdminDashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Sidebar */}
      <aside className="flex shrink-0 flex-col justify-between border-b border-white/10 bg-surface text-on-surface md:w-64 md:border-b-0 md:border-r">
        <div>
          <div className="flex items-center gap-2.5 px-6 py-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo/546cf85e-7042-499d-ba1f-b16d10355d92.jpeg"
              alt={site.name}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
            <div className="leading-tight">
              <p className="text-sm font-bold">{site.shortName}</p>
              <p className="text-[0.65rem] uppercase tracking-widest text-on-surface-variant">Admin</p>
            </div>
          </div>

          <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-0">
            {navItems.map((item) => (
              <AdminNavLink key={item.href} href={item.href} icon={item.icon} label={item.label} />
            ))}
          </nav>
        </div>

        <div className="space-y-1 border-t border-white/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
          >
            <Icon name="open_in_new" className="text-lg" />
            View Live Site
          </Link>
          <form action={logoutAdmin}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-on-surface-variant transition-colors hover:bg-white/5 hover:text-on-surface"
            >
              <Icon name="logout" className="text-lg" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1 px-5 py-8 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
