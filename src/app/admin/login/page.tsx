import type { Metadata } from "next";
import { Icon } from "@/components/ui/Icon";
import { site } from "@/data/site";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Admin Sign In",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo/546cf85e-7042-499d-ba1f-b16d10355d92.jpeg"
            alt={site.name}
            width={56}
            height={56}
            className="h-14 w-14 rounded-full object-cover"
          />
          <h1 className="mt-4 font-[var(--font-heading)] text-xl text-on-surface">
            {site.name} Admin
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-on-surface-variant">
            <Icon name="lock" className="text-sm" />
            Umrah Packages management
          </p>
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-7 shadow-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
