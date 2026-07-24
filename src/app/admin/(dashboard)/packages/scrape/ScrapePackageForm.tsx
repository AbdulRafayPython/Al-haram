"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  scrapePackagesAction,
  applyScrapedChangesAction,
  type ScrapeItem,
  type ScrapePackagesResult,
} from "@/app/admin/actions";
import type { FieldChange } from "@/lib/scrapePackage";
import { PackageJsonEditor, Alert } from "../PackageJsonEditor";

type Filter = "all" | "changed" | "new" | "unchanged";
const PAGE = 20;

export function ScrapePackageForm() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<ScrapePackagesResult | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [visible, setVisible] = useState(PAGE);
  const [pending, startTransition] = useTransition();

  function runScrape() {
    startTransition(async () => {
      const res = await scrapePackagesAction(url);
      setResult(res);
      setVisible(PAGE);
      setFilter(res.counts?.changed ? "changed" : res.counts?.new ? "new" : "all");
    });
  }

  const items = result?.items ?? [];
  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.status === filter)),
    [items, filter],
  );

  return (
    <div className="space-y-5">
      {/* URL box */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Package listing URL
          </span>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim() && !pending) {
                  e.preventDefault();
                  runScrape();
                }
              }}
              placeholder="https://example.com/umrah-packages"
              className="min-w-0 flex-1 rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
            <button
              type="button"
              onClick={runScrape}
              disabled={pending || !url.trim()}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-40"
            >
              {pending ? (
                <Icon name="progress_activity" className="animate-spin text-base" />
              ) : (
                <Icon name="travel_explore" className="text-base" />
              )}
              {pending ? "Scraping…" : "Scrape all"}
            </button>
          </div>
        </label>
        <p className="mt-3 text-xs leading-relaxed text-on-surface-variant">
          Reads <strong>every</strong> package on the page, then flags which are new, which already exist,
          and which have changed (seats, prices, dates, times). Nothing is saved until you create or apply.
        </p>
      </div>

      {result && !result.ok && <Alert tone="error" title="Couldn't scrape that page" lines={[result.error ?? "Unknown error."]} />}

      {result?.ok && (
        <>
          {/* Summary + filters */}
          <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
            <p className="text-sm text-on-surface">
              Found <strong>{result.totalOnPage}</strong> package{result.totalOnPage === 1 ? "" : "s"} on{" "}
              <span className="text-on-surface-variant">{result.site}</span>
              {result.truncated && <span className="text-on-surface-variant"> (showing the first {items.length})</span>}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <FilterTab label="All" count={items.length} active={filter === "all"} onClick={() => setFilter("all")} />
              <FilterTab
                label="Changed"
                count={result.counts?.changed ?? 0}
                tone="changed"
                active={filter === "changed"}
                onClick={() => setFilter("changed")}
              />
              <FilterTab
                label="New"
                count={result.counts?.new ?? 0}
                tone="new"
                active={filter === "new"}
                onClick={() => setFilter("new")}
              />
              <FilterTab
                label="Unchanged"
                count={result.counts?.unchanged ?? 0}
                tone="unchanged"
                active={filter === "unchanged"}
                onClick={() => setFilter("unchanged")}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <p className="rounded-xl border border-outline-variant/40 bg-surface-container-low px-4 py-6 text-center text-sm text-on-surface-variant">
              Nothing in this filter.
            </p>
          ) : (
            <div className="space-y-3">
              {filtered.slice(0, visible).map((item, i) => (
                <ScrapeItemCard key={`${item.packageCode ?? "x"}-${i}`} item={item} />
              ))}
              {filtered.length > visible && (
                <button
                  type="button"
                  onClick={() => setVisible((v) => v + PAGE)}
                  className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-low py-3 text-sm font-semibold text-on-surface transition-colors hover:border-secondary"
                >
                  Show {Math.min(PAGE, filtered.length - visible)} more ({filtered.length - visible} left)
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FilterTab({
  label,
  count,
  active,
  onClick,
  tone,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  tone?: "changed" | "new" | "unchanged";
}) {
  const dot =
    tone === "changed" ? "bg-secondary" : tone === "new" ? "bg-success" : tone === "unchanged" ? "bg-on-surface-variant/40" : "";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "border-secondary bg-secondary/10 text-on-surface"
          : "border-outline-variant/50 text-on-surface-variant hover:border-secondary/60"
      }`}
    >
      {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
      {label}
      <span className="rounded-full bg-surface-container px-1.5 py-0.5 text-[0.65rem] text-on-surface-variant">{count}</span>
    </button>
  );
}

function ScrapeItemCard({ item }: { item: ScrapeItem }) {
  const [raw, setRaw] = useState(item.json);
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<FieldChange[] | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applying, startApply] = useTransition();
  const [created, setCreated] = useState<string | null>(null);

  function applyChanges() {
    setApplyError(null);
    startApply(async () => {
      const res = await applyScrapedChangesAction(item.matchedId!, item.summary);
      if (res.ok) setApplied(res.updated ?? []);
      else setApplyError(res.error ?? "Could not apply the changes.");
    });
  }

  const done = created || applied;

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={created ? "created" : applied ? "updated" : item.status} />
            <p className="font-medium text-on-surface">{item.title}</p>
          </div>
          <p className="mt-1 text-xs text-on-surface-variant">
            {[item.packageCode, item.summary.cityCode, item.summary.departureDate, item.summary.durationDays ? `${item.summary.durationDays}d` : null]
              .filter(Boolean)
              .join(" · ") || "—"}
            {item.matchedTitle && item.status !== "new" && (
              <span className="text-on-surface-variant/70"> · matches “{item.matchedTitle}”</span>
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.status === "changed" && !done && (
            <button
              type="button"
              onClick={applyChanges}
              disabled={applying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2 text-xs font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-40"
            >
              {applying ? <Icon name="progress_activity" className="animate-spin text-sm" /> : <Icon name="sync" className="text-sm" />}
              Apply changes
            </button>
          )}
          {!done && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-4 py-2 text-xs font-semibold text-on-surface transition-colors hover:border-secondary"
            >
              <Icon name={open ? "expand_less" : "edit"} className="text-sm" />
              {item.status === "new" ? "Review & create" : open ? "Hide" : "Edit as new"}
            </button>
          )}
        </div>
      </div>

      {/* Change list */}
      {item.status === "changed" && !done && item.changes.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {item.changes.map((c, i) => (
            <li key={i} className="rounded-lg border border-secondary/30 bg-secondary-container/20 px-2.5 py-1 text-xs text-on-surface">
              <span className="text-on-surface-variant">{c.label}:</span> <span className="line-through opacity-60">{c.from}</span>{" "}
              <Icon name="arrow_forward" className="align-middle text-xs" /> <strong>{c.to}</strong>
            </li>
          ))}
        </ul>
      )}

      {item.status === "new" && item.missing.length > 0 && !open && !created && (
        <p className="mt-2 text-xs text-on-surface-variant">
          <Icon name="info" className="align-middle text-xs" /> Needs before saving: {item.missing.join("; ")}.
        </p>
      )}

      {applyError && <p className="mt-2 text-xs text-error">{applyError}</p>}
      {applied && (
        <p className="mt-2 text-xs text-success">
          <Icon name="check_circle" className="align-middle text-sm" /> Updated{" "}
          {applied.length ? applied.map((c) => c.label.toLowerCase()).join(", ") : "— already up to date"}.
        </p>
      )}
      {created && (
        <p className="mt-2 text-xs text-success">
          <Icon name="check_circle" className="align-middle text-sm" /> Created as a new package.
        </p>
      )}

      {/* Inline editor for creating (new, or "edit as new" on a match) */}
      {open && !created && (
        <div className="mt-4 border-t border-outline-variant/40 pt-4">
          <PackageJsonEditor
            raw={raw}
            onRawChange={setRaw}
            label="Package JSON — edit to complete, then create"
            onCreated={(c) => {
              setCreated(c.id);
              setOpen(false);
            }}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ScrapeItem["status"] | "created" | "updated" }) {
  const map: Record<string, { label: string; cls: string; icon: string }> = {
    new: { label: "New", cls: "border-success/40 bg-success/10 text-success", icon: "fiber_new" },
    changed: { label: "Changed", cls: "border-secondary/50 bg-secondary-container/30 text-on-secondary-container", icon: "sync_problem" },
    unchanged: { label: "Up to date", cls: "border-outline-variant/50 bg-surface-container text-on-surface-variant", icon: "check" },
    created: { label: "Created", cls: "border-success/40 bg-success/10 text-success", icon: "check_circle" },
    updated: { label: "Updated", cls: "border-success/40 bg-success/10 text-success", icon: "check_circle" },
  };
  const s = map[status];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider ${s.cls}`}>
      <Icon name={s.icon} className="text-xs" />
      {s.label}
    </span>
  );
}
