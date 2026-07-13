"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { createAirlineAction } from "@/app/admin/actions";

export function AddAirlineForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    const clean = name.trim();
    if (!clean) return;
    setError(null);
    startTransition(async () => {
      try {
        await createAirlineAction(clean);
        setName("");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not add airline.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[220px] flex-1">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            New airline name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Qatar Airways"
            className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={pending || !name.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-4 py-2.5 text-sm font-semibold text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-50"
        >
          {pending ? (
            <Icon name="progress_activity" className="animate-spin text-base" />
          ) : (
            <Icon name="add" className="text-base" />
          )}
          Add Airline
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </div>
  );
}
