"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { formatPkr } from "@/lib/format";
import { formatClock } from "@/lib/flight";
import { PACKAGE_JSON_SAMPLE, PACKAGE_JSON_FIELD_NOTES } from "@/lib/importPackage";
import {
  previewPackageImport,
  importPackageAction,
  type ImportActionResult,
} from "@/app/admin/actions";

export function ImportPackageForm() {
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [result, setResult] = useState<ImportActionResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // A successful preview (ok + preview, not yet created) unlocks "Create".
  const previewed = Boolean(result?.ok && result.preview && !result.created);

  function runPreview() {
    setFatalError(null);
    startTransition(async () => {
      try {
        const res = await previewPackageImport(raw);
        setResult(res);
      } catch (e) {
        setFatalError(e instanceof Error ? e.message : "Could not validate. Please try again.");
      }
    });
  }

  function runCreate() {
    setFatalError(null);
    startTransition(async () => {
      try {
        const res = await importPackageAction(raw);
        setResult(res);
        if (res.created) router.push("/admin/packages");
      } catch (e) {
        setFatalError(e instanceof Error ? e.message : "Could not create the package. Please try again.");
      }
    });
  }

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
      <div className="space-y-5">
        <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Paste package JSON
            </span>
            <textarea
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setResult(null);
              }}
              rows={16}
              spellCheck={false}
              placeholder='Paste the filled-in JSON here…'
              className="w-full resize-y rounded-lg border border-outline-variant bg-surface px-4 py-3 font-mono text-xs leading-relaxed text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </label>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={runPreview}
              disabled={pending || !raw.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-40"
            >
              {pending && !previewed ? (
                <Icon name="progress_activity" className="animate-spin text-base" />
              ) : (
                <Icon name="fact_check" className="text-base" />
              )}
              Validate &amp; Preview
            </button>
            <button
              type="button"
              onClick={runCreate}
              disabled={pending || !previewed}
              title={previewed ? undefined : "Validate the JSON first"}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-40"
            >
              <Icon name="publish" className="text-base" />
              Create Package
            </button>
            {raw && (
              <button
                type="button"
                onClick={() => {
                  setRaw("");
                  setResult(null);
                }}
                className="text-sm font-medium text-on-surface-variant hover:text-on-surface"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {fatalError && <Alert tone="error" title="Something went wrong" lines={[fatalError]} />}

        {result && !result.ok && (
          <Alert
            tone="error"
            title={`Fix ${result.errors.length} ${result.errors.length === 1 ? "problem" : "problems"} before importing`}
            lines={result.errors}
          />
        )}

        {result?.warnings && result.warnings.length > 0 && (
          <Alert tone="warning" title="Please double-check" lines={result.warnings} />
        )}

        {result?.created && (
          <Alert tone="success" title="Package created" lines={[`"${result.created.title}" was added.`]} />
        )}

        {previewed && result?.preview && <Preview preview={result.preview} />}
      </div>

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

function Alert({
  tone,
  title,
  lines,
}: {
  tone: "error" | "warning" | "success";
  title: string;
  lines: string[];
}) {
  const styles = {
    error: "border-error/30 bg-error/10 text-error",
    warning: "border-secondary/40 bg-secondary-container/30 text-on-secondary-container",
    success: "border-success/30 bg-success/10 text-success",
  }[tone];
  const icon = { error: "error", warning: "warning", success: "check_circle" }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon name={icon} className="text-base" />
        {title}
      </p>
      <ul className="mt-2 space-y-1 pl-1">
        {lines.map((line, i) => (
          <li key={i} className="flex gap-1.5">
            <span className="select-none opacity-60">•</span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Preview({
  preview,
}: {
  preview: NonNullable<ImportActionResult["preview"]>;
}) {
  const p = preview.input;
  const priceFor: Record<string, number | null> = {
    Sharing: p.priceSharing,
    Quad: p.priceQuad,
    Triple: p.priceTriple,
    Double: p.priceDouble,
  };
  const flight =
    p.flightRoute || p.flightOutboundNo || p.flightDepartureTime
      ? [
          p.flightRoute,
          p.flightOutboundNo && `Out ${p.flightOutboundNo}`,
          p.flightInboundNo && `In ${p.flightInboundNo}`,
          p.flightDepartureTime && `Dep ${formatClock(p.flightDepartureTime)}`,
          p.flightArrivalTime && `Arr ${formatClock(p.flightArrivalTime)}`,
        ]
          .filter(Boolean)
          .join(" · ")
      : "—";

  return (
    <div className="rounded-2xl border border-success/30 bg-surface-container-lowest p-6">
      <p className="flex items-center gap-2 text-sm font-semibold text-success">
        <Icon name="check_circle" className="text-base" />
        Looks good — review, then create
      </p>
      <p className="mt-3 font-[var(--font-heading)] text-lg text-on-surface">{p.title}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-on-surface-variant sm:grid-cols-3">
        <Item label="Route" value={`${p.departureCityCode} · ${p.airline}`} />
        <Item label="Departure" value={p.departureDate} />
        <Item label="Duration" value={`${p.durationDays} days`} />
        <Item label="Makkah" value={`${preview.makkahHotelName} (${p.makkahNights}n)`} />
        <Item label="Madinah" value={`${preview.madinahHotelName} (${p.madinahNights}n)`} />
        <Item label="Room types" value={p.roomTypes.join(", ") || "—"} />
        {p.roomTypes.map((r) => (
          <Item key={r} label={r} value={priceFor[r] != null ? formatPkr(priceFor[r]!) : "—"} />
        ))}
        {p.priceInfant != null && <Item label="Infant" value={formatPkr(p.priceInfant)} />}
        {p.priceChildNoBed != null && <Item label="Child (No Bed)" value={formatPkr(p.priceChildNoBed)} />}
        <Item label="Baggage" value={p.baggage || "—"} />
        <Item label="Seats" value={`${p.seatsAvailable}/${p.seatsTotal}`} />
        <Item label="Flight" value={flight} />
        <Item label="Package code" value={p.packageCode || "—"} />
        <Item label="Group code" value={p.groupCode || "—"} />
        <Item label="Featured" value={p.featured ? "Yes" : "No"} />
      </dl>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-on-surface">{value}</dd>
    </div>
  );
}
