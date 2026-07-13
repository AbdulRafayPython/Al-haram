"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { createHotelAction, updateHotelAction, type HotelFormInput } from "@/app/admin/actions";
import type { Hotel } from "@/data/types";

const CITIES: Hotel["city"][] = ["Makkah", "Madinah"];

function toFormInput(hotel?: Hotel): HotelFormInput {
  if (!hotel) {
    return {
      name: "",
      city: "Makkah",
      location: "",
      distance: "",
      rateSharing: null,
      rateDouble: 0,
      rateTriple: 0,
      rateQuad: 0,
    };
  }
  return {
    name: hotel.name,
    city: hotel.city,
    location: hotel.location,
    distance: hotel.distance,
    rateSharing: hotel.rates.sharing ?? null,
    rateDouble: hotel.rates.double,
    rateTriple: hotel.rates.triple,
    rateQuad: hotel.rates.quad,
  };
}

/** Add/Edit hotel modal — same mode toggles on whether `hotel` is passed. */
export function HotelFormModal({
  hotel,
  onClose,
  onSaved,
}: {
  hotel?: Hotel;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(hotel);
  const [form, setForm] = useState<HotelFormInput>(() => toFormInput(hotel));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  function set<K extends keyof HotelFormInput>(key: K, value: HotelFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canSubmit =
    form.name.trim() && form.location.trim() && form.distance.trim() &&
    form.rateDouble > 0 && form.rateTriple > 0 && form.rateQuad > 0;

  function submit() {
    if (!canSubmit) return;
    setError(null);
    startTransition(async () => {
      try {
        if (isEdit && hotel) {
          await updateHotelAction(hotel.id, form);
        } else {
          await createHotelAction(form);
        }
        onSaved();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={isEdit ? `Edit ${hotel?.name}` : "Add hotel"}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg rounded-2xl border border-outline-variant/50 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-on-surface-variant transition-colors hover:text-on-surface"
          aria-label="Close"
        >
          <Icon name="close" className="text-xl" />
        </button>

        <h3 className="font-[var(--font-heading)] text-xl text-on-surface">
          {isEdit ? "Edit Hotel" : "Add Hotel"}
        </h3>

        <div className="mt-5 space-y-4">
          <Field label="Hotel name">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Hilton Suites Makkah"
              className={inputClass}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="City">
              <div className="relative">
                <select
                  value={form.city}
                  onChange={(e) => set("city", e.target.value as Hotel["city"])}
                  className={selectClass}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <Icon
                  name="expand_more"
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
                />
              </div>
            </Field>
            <Field label="Distance / shuttle">
              <input
                value={form.distance}
                onChange={(e) => set("distance", e.target.value)}
                placeholder="e.g. 450-500 MTR"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="e.g. Ajyad Street, Makkah"
              className={inputClass}
            />
          </Field>

          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Per-night rates (SAR)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Sharing">
                <input
                  type="number"
                  min={0}
                  value={form.rateSharing ?? ""}
                  onChange={(e) => set("rateSharing", e.target.value ? Number(e.target.value) : null)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>
              <Field label="Quad">
                <input
                  type="number"
                  min={0}
                  value={form.rateQuad || ""}
                  onChange={(e) => set("rateQuad", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Triple">
                <input
                  type="number"
                  min={0}
                  value={form.rateTriple || ""}
                  onChange={(e) => set("rateTriple", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field label="Double">
                <input
                  type="number"
                  min={0}
                  value={form.rateDouble || ""}
                  onChange={(e) => set("rateDouble", Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
            <Icon name="error" className="text-base" />
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={pending || !canSubmit}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary-fixed px-6 py-3 text-sm font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-60"
        >
          {pending ? (
            <Icon name="progress_activity" className="animate-spin text-base" />
          ) : (
            <Icon name={isEdit ? "save" : "add"} className="text-base" />
          )}
          {isEdit ? "Save Changes" : "Add Hotel"}
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";
const selectClass =
  "w-full appearance-none rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      {children}
    </label>
  );
}
