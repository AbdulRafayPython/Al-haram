import type { Metadata } from "next";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { ImportPackageForm } from "./ImportPackageForm";

export const metadata: Metadata = {
  title: "Import Package (JSON)",
  robots: { index: false, follow: false },
};

export default function ImportPackagePage() {
  return (
    <div>
      <Link
        href="/admin/packages"
        className="inline-flex items-center gap-1 text-sm font-medium text-on-surface-variant transition-colors hover:text-on-surface"
      >
        <Icon name="arrow_back" className="text-base" /> Back to packages
      </Link>
      <h1 className="mt-3 font-[var(--font-heading)] text-2xl text-on-surface">Import Package from JSON</h1>
      <p className="mt-1 max-w-2xl text-sm text-on-surface-variant">
        The fastest way to add a package: copy the sample, have ChatGPT convert your own package details
        into that exact shape, paste it back, and the system extracts and checks every field for you. Nothing
        is saved until you validate and confirm.
      </p>
      <div className="mt-6">
        <ImportPackageForm />
      </div>
    </div>
  );
}
