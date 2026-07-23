"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { PACKAGE_JSON_SAMPLE, PACKAGE_JSON_FIELD_NOTES } from "@/lib/importPackage";
import { PackageJsonEditor } from "../PackageJsonEditor";

export function ImportPackageForm() {
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState(false);
  const [showSample, setShowSample] = useState(false);

  async function copySample() {
    try {
      await navigator.clipboard.writeText(PACKAGE_JSON_SAMPLE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setShowSample(true);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      {/* Left: paste + actions + results */}
      <PackageJsonEditor raw={raw} onRawChange={setRaw} label="Paste package JSON" />

      {/* Right: sample + field guide */}
      <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-[var(--font-heading)] text-base text-on-surface">Sample JSON</h2>
            <button
              type="button"
              onClick={copySample}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-semibold text-on-surface transition-colors hover:border-secondary"
            >
              <Icon name={copied ? "check" : "content_copy"} className="text-sm" />
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
            Copy this, ask ChatGPT to reshape your own package details into the exact same shape, then paste
            the result on the left. Values must match your existing cities, airlines, and hotels.
          </p>
          <button
            type="button"
            onClick={() => setShowSample((s) => !s)}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
          >
            <Icon name={showSample ? "expand_less" : "expand_more"} className="text-sm" />
            {showSample ? "Hide" : "Show"} sample
          </button>
          {showSample && (
            <pre className="mt-3 max-h-80 overflow-auto rounded-lg border border-outline-variant/40 bg-surface p-3 font-mono text-[0.7rem] leading-relaxed text-on-surface-variant">
              {PACKAGE_JSON_SAMPLE}
            </pre>
          )}
        </div>

        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
          <h2 className="font-[var(--font-heading)] text-base text-on-surface">Field guide</h2>
          <dl className="mt-3 space-y-2.5 text-xs">
            {PACKAGE_JSON_FIELD_NOTES.map((f) => (
              <div key={f.field}>
                <dt className="font-mono font-semibold text-on-surface">{f.field}</dt>
                <dd className="text-on-surface-variant">{f.note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[0.7rem] text-on-surface-variant">* required. Fields marked optional can be omitted.</p>
        </div>
      </aside>
    </div>
  );
}
