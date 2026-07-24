"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { formatPkr } from "@/lib/format";
import { formatClock } from "@/lib/flight";
import {
  previewPackageImport,
  importPackageAction,
  type ImportActionResult,
} from "@/app/admin/actions";

/**
 * Controlled package-JSON editor: textarea + Validate/Preview + Create, plus the
 * result alerts and preview card. Shared by the manual JSON import and the URL
 * scraper (which pre-fills `raw` with an extracted draft). The parent owns the
 * `raw` string so it can seed it; everything else is internal.
 */
export function PackageJsonEditor({
  raw,
  onRawChange,
  label = "Package JSON",
  onCreated,
}: {
  raw: string;
  onRawChange: (value: string) => void;
  label?: string;
  /** When provided, stay on the page and call this after a successful create
   * (used by the multi-package scrape list). When omitted, redirect to the list. */
  onCreated?: (created: { id: string; title: string }) => void;
}) {
  const router = useRouter();
  const [result, setResult] = useState<ImportActionResult | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Any change to the JSON invalidates a prior preview (typed or seeded by scrape).
  useEffect(() => {
    setResult(null);
  }, [raw]);

  const previewed = Boolean(result?.ok && result.preview && !result.created);

  function runPreview() {
    setFatalError(null);
    startTransition(async () => {
      try {
        setResult(await previewPackageImport(raw));
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
        if (res.created) {
          if (onCreated) onCreated(res.created);
          else router.push("/admin/packages");
        }
      } catch (e) {
        setFatalError(e instanceof Error ? e.message : "Could not create the package. Please try again.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {label}
          </span>
          <textarea
            value={raw}
            onChange={(e) => onRawChange(e.target.value)}
            rows={16}
            spellCheck={false}
            placeholder="Paste the filled-in JSON here…"
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
              onClick={() => onRawChange("")}
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
  );
}

export function Alert({
  tone,
  title,
  lines,
}: {
  tone: "error" | "warning" | "success" | "info";
  title: string;
  lines: string[];
}) {
  const styles = {
    error: "border-error/30 bg-error/10 text-error",
    warning: "border-secondary/40 bg-secondary-container/30 text-on-secondary-container",
    success: "border-success/30 bg-success/10 text-success",
    info: "border-outline-variant/50 bg-surface-container-low text-on-surface",
  }[tone];
  const icon = { error: "error", warning: "warning", success: "check_circle", info: "info" }[tone];
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      <p className="flex items-center gap-2 font-semibold">
        <Icon name={icon} className="text-base" />
        {title}
      </p>
      {lines.length > 0 && (
        <ul className="mt-2 space-y-1 pl-1">
          {lines.map((line, i) => (
            <li key={i} className="flex gap-1.5">
              <span className="select-none opacity-60">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Preview({ preview }: { preview: NonNullable<ImportActionResult["preview"]> }) {
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
