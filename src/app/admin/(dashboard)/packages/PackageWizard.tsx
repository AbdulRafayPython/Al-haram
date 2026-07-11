"use client";

import { useMemo, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { formatPkr } from "@/lib/format";
import { departureCities, airlines } from "@/data/packages";
import { createPackageAction, updatePackageAction, type PackageFormInput } from "@/app/admin/actions";
import type { HotelOption } from "@/lib/data/packages";

const steps = ["Route & Airline", "Hotels & Stay", "Flight Details", "Pricing & Seats", "Review"] as const;
const roomTypes = ["Sharing", "Quad", "Triple", "Double"] as const;

const emptyForm = (hotelOptions: HotelOption[]): PackageFormInput => {
  const makkah = hotelOptions.find((h) => h.city === "Makkah");
  const madinah = hotelOptions.find((h) => h.city === "Madinah");
  return {
    title: "",
    airline: airlines[0],
    departureCity: `${departureCities[0].name} (${departureCities[0].code})`,
    departureCityCode: departureCities[0].code,
    durationDays: 14,
    departureDate: "",
    makkahHotelId: makkah?.id ?? null,
    madinahHotelId: madinah?.id ?? null,
    makkahNights: 8,
    madinahNights: 6,
    roomType: "Quad",
    priceSharing: 0,
    priceQuad: null,
    priceTriple: null,
    priceDouble: null,
    priceInfant: 75000,
    seatsTotal: 40,
    seatsAvailable: 40,
    packageCode: null,
    groupCode: null,
    flightRoute: `${departureCities[0].code} → JED`,
    flightOutboundNo: null,
    flightInboundNo: null,
    flightOutboundTime: null,
    flightInboundTime: null,
    flightDepartureTime: null,
    flightArrivalTime: null,
    featured: false,
  };
};

export function PackageWizard({
  hotelOptions,
  mode,
  packageId,
  initialValues,
}: {
  hotelOptions: HotelOption[];
  mode: "create" | "edit";
  packageId?: string;
  initialValues?: PackageFormInput;
}) {
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PackageFormInput>(initialValues ?? emptyForm(hotelOptions));
  const [customAirline, setCustomAirline] = useState(
    () => !!initialValues && !airlines.includes(initialValues.airline),
  );
  const [customCity, setCustomCity] = useState(
    () => !!initialValues && !departureCities.some((c) => c.code === initialValues.departureCityCode),
  );

  const makkahHotels = useMemo(() => hotelOptions.filter((h) => h.city === "Makkah"), [hotelOptions]);
  const madinahHotels = useMemo(() => hotelOptions.filter((h) => h.city === "Madinah"), [hotelOptions]);

  function set<K extends keyof PackageFormInput>(key: K, value: PackageFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canContinue = (() => {
    if (step === 0) {
      return Boolean(form.title.trim() && form.airline.trim() && form.departureDate && form.durationDays > 0);
    }
    if (step === 1) {
      return Boolean(form.makkahHotelId && form.madinahHotelId && form.makkahNights >= 0 && form.madinahNights >= 0);
    }
    if (step === 3) {
      return form.priceSharing > 0 && form.seatsTotal >= 0 && form.seatsAvailable >= 0 && form.seatsAvailable <= form.seatsTotal;
    }
    return true;
  })();

  const next = () => {
    if (step === steps.length - 2 && !form.packageCode) {
      const serial = Date.now().toString().slice(-5);
      setForm((f) => ({ ...f, packageCode: `UP-${serial}`, groupCode: f.groupCode ?? `UG-${serial}` }));
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const makkahHotelName = makkahHotels.find((h) => h.id === form.makkahHotelId)?.name ?? "Select a hotel";
  const madinahHotelName = madinahHotels.find((h) => h.id === form.madinahHotelId)?.name ?? "Select a hotel";

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && packageId) {
          await updatePackageAction(packageId, form);
        } else {
          await createPackageAction(form);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 md:p-8">
      {/* Progress */}
      <ol className="mb-8 flex items-center">
        {steps.map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <button
              type="button"
              onClick={() => setStep(i)}
              className="flex flex-col items-center gap-1.5"
            >
              <span
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                  i < step && "bg-success text-white",
                  i === step && "bg-primary text-on-primary",
                  i > step && "bg-surface-container text-on-surface-variant",
                )}
              >
                {i < step ? <Icon name="check" className="text-lg" /> : i + 1}
              </span>
              <span
                className={clsx(
                  "hidden text-xs font-medium sm:block",
                  i === step ? "text-on-surface" : "text-on-surface-variant",
                )}
              >
                {label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <span
                className={clsx("mx-2 h-0.5 flex-1 rounded-full", i < step ? "bg-success" : "bg-surface-container")}
              />
            )}
          </li>
        ))}
      </ol>

      {error && (
        <p className="mb-6 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
          <Icon name="error" className="text-base" />
          {error}
        </p>
      )}

      {/* Step content */}
      <div className="min-h-[320px]">
        {step === 0 && (
          <StepShell title="Route & Airline" subtitle="The basics of this departure.">
            <div className="space-y-5">
              <Field label="Package title">
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Premium Umrah — Lahore"
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Departure city">
                  {customCity ? (
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input
                        value={form.departureCity}
                        onChange={(e) => set("departureCity", e.target.value)}
                        placeholder="e.g. Quetta (UET)"
                        className={inputClass}
                      />
                      <input
                        value={form.departureCityCode}
                        onChange={(e) => set("departureCityCode", e.target.value.toUpperCase())}
                        placeholder="Code"
                        maxLength={4}
                        className={clsx(inputClass, "w-20 text-center uppercase")}
                      />
                    </div>
                  ) : (
                    <Select
                      value={form.departureCityCode}
                      onChange={(v) => {
                        const city = departureCities.find((c) => c.code === v)!;
                        set("departureCityCode", city.code);
                        set("departureCity", `${city.name} (${city.code})`);
                        set("flightRoute", `${city.code} → JED`);
                      }}
                    >
                      {departureCities.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name} ({c.code})
                        </option>
                      ))}
                    </Select>
                  )}
                  <ToggleCustom checked={customCity} onChange={setCustomCity} label="Use a different city" />
                </Field>

                <Field label="Airline">
                  {customAirline ? (
                    <input
                      value={form.airline}
                      onChange={(e) => set("airline", e.target.value)}
                      placeholder="Airline name"
                      className={inputClass}
                    />
                  ) : (
                    <Select value={form.airline} onChange={(v) => set("airline", v)}>
                      {airlines.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </Select>
                  )}
                  <ToggleCustom checked={customAirline} onChange={setCustomAirline} label="Use a different airline" />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Departure date">
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => set("departureDate", e.target.value)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Duration (days)">
                  <input
                    type="number"
                    min={1}
                    value={form.durationDays}
                    onChange={(e) => set("durationDays", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </StepShell>
        )}

        {step === 1 && (
          <StepShell title="Hotels & Stay" subtitle="Pick the Makkah and Madinah hotels and nights.">
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Makkah hotel">
                  <Select value={form.makkahHotelId ?? ""} onChange={(v) => set("makkahHotelId", v)}>
                    {makkahHotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.location}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nights in Makkah">
                  <input
                    type="number"
                    min={0}
                    value={form.makkahNights}
                    onChange={(e) => set("makkahNights", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Madinah hotel">
                  <Select value={form.madinahHotelId ?? ""} onChange={(v) => set("madinahHotelId", v)}>
                    {madinahHotels.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name} — {h.location}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Nights in Madinah">
                  <input
                    type="number"
                    min={0}
                    value={form.madinahNights}
                    onChange={(e) => set("madinahNights", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              {form.makkahNights + form.madinahNights !== form.durationDays && (
                <p className="flex items-center gap-2 rounded-lg bg-secondary-container/40 px-4 py-2.5 text-xs text-on-secondary-container">
                  <Icon name="info" className="text-base" />
                  Nights add up to {form.makkahNights + form.madinahNights}, package duration is{" "}
                  {form.durationDays} days — double check before publishing.
                </p>
              )}

              <Field label="Room type">
                <div className="grid grid-cols-4 gap-3">
                  {roomTypes.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set("roomType", r)}
                      className={clsx(
                        "rounded-xl border p-3 text-center text-sm font-medium transition-colors",
                        form.roomType === r
                          ? "border-secondary bg-secondary-container text-on-secondary-container"
                          : "border-outline-variant/50 text-on-surface-variant hover:border-secondary/40",
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </Field>
            </div>
          </StepShell>
        )}

        {step === 2 && (
          <StepShell title="Flight Details" subtitle="Optional — leave blank if not confirmed yet.">
            <div className="space-y-5">
              <Field label="Route">
                <input
                  value={form.flightRoute ?? ""}
                  onChange={(e) => set("flightRoute", e.target.value || null)}
                  placeholder="e.g. KHI → JED"
                  className={inputClass}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Outbound flight no.">
                  <input
                    value={form.flightOutboundNo ?? ""}
                    onChange={(e) => set("flightOutboundNo", e.target.value || null)}
                    placeholder="e.g. SV-803"
                    className={inputClass}
                  />
                </Field>
                <Field label="Inbound flight no.">
                  <input
                    value={form.flightInboundNo ?? ""}
                    onChange={(e) => set("flightInboundNo", e.target.value || null)}
                    placeholder="e.g. SV-802"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Outbound check-in time">
                  <input
                    value={form.flightOutboundTime ?? ""}
                    onChange={(e) => set("flightOutboundTime", e.target.value || null)}
                    placeholder="e.g. 2:10 AM"
                    className={inputClass}
                  />
                </Field>
                <Field label="Inbound check-in time">
                  <input
                    value={form.flightInboundTime ?? ""}
                    onChange={(e) => set("flightInboundTime", e.target.value || null)}
                    placeholder="e.g. 1:40 AM"
                    className={inputClass}
                  />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Departure time (from Pakistan)">
                  <input
                    value={form.flightDepartureTime ?? ""}
                    onChange={(e) => set("flightDepartureTime", e.target.value || null)}
                    placeholder="e.g. 5:15 AM"
                    className={inputClass}
                  />
                </Field>
                <Field label="Arrival time (back home)">
                  <input
                    value={form.flightArrivalTime ?? ""}
                    onChange={(e) => set("flightArrivalTime", e.target.value || null)}
                    placeholder="e.g. 6:45 AM"
                    className={inputClass}
                  />
                </Field>
              </div>
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Pricing & Seats" subtitle="Per-person price by room occupancy, in PKR.">
            <div className="space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Sharing (base / from price)">
                  <input
                    type="number"
                    min={0}
                    value={form.priceSharing}
                    onChange={(e) => set("priceSharing", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Quad">
                  <input
                    type="number"
                    min={0}
                    value={form.priceQuad ?? ""}
                    onChange={(e) => set("priceQuad", e.target.value ? Number(e.target.value) : null)}
                    placeholder={String(form.priceSharing || 0)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Triple">
                  <input
                    type="number"
                    min={0}
                    value={form.priceTriple ?? ""}
                    onChange={(e) => set("priceTriple", e.target.value ? Number(e.target.value) : null)}
                    placeholder={String(form.priceSharing || 0)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Double">
                  <input
                    type="number"
                    min={0}
                    value={form.priceDouble ?? ""}
                    onChange={(e) => set("priceDouble", e.target.value ? Number(e.target.value) : null)}
                    placeholder={String(form.priceSharing || 0)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Infant">
                  <input
                    type="number"
                    min={0}
                    value={form.priceInfant ?? ""}
                    onChange={(e) => set("priceInfant", e.target.value ? Number(e.target.value) : null)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Total seats">
                  <input
                    type="number"
                    min={0}
                    value={form.seatsTotal}
                    onChange={(e) => set("seatsTotal", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
                <Field label="Seats available">
                  <input
                    type="number"
                    min={0}
                    max={form.seatsTotal}
                    value={form.seatsAvailable}
                    onChange={(e) => set("seatsAvailable", Number(e.target.value))}
                    className={inputClass}
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2.5 text-sm text-on-surface">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => set("featured", e.target.checked)}
                  className="h-4 w-4 accent-secondary"
                />
                Feature this package on the board
              </label>
            </div>
          </StepShell>
        )}

        {step === 4 && (
          <StepShell title="Review & Publish" subtitle="Confirm the details, then publish to the live board.">
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Package code">
                  <input
                    value={form.packageCode ?? ""}
                    onChange={(e) => set("packageCode", e.target.value || null)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Group code">
                  <input
                    value={form.groupCode ?? ""}
                    onChange={(e) => set("groupCode", e.target.value || null)}
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-5 text-sm">
                <p className="font-[var(--font-heading)] text-lg text-on-surface">{form.title || "Untitled package"}</p>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 text-on-surface-variant sm:grid-cols-3">
                  <SummaryItem label="Route" value={`${form.departureCityCode} · ${form.airline}`} />
                  <SummaryItem label="Departure" value={form.departureDate || "—"} />
                  <SummaryItem label="Duration" value={`${form.durationDays} days`} />
                  <SummaryItem label="Makkah" value={`${makkahHotelName} (${form.makkahNights}n)`} />
                  <SummaryItem label="Madinah" value={`${madinahHotelName} (${form.madinahNights}n)`} />
                  <SummaryItem label="Room" value={form.roomType} />
                  <SummaryItem label="From price" value={formatPkr(form.priceSharing || 0)} />
                  <SummaryItem label="Seats" value={`${form.seatsAvailable}/${form.seatsTotal}`} />
                  <SummaryItem label="Featured" value={form.featured ? "Yes" : "No"} />
                </dl>
              </div>
            </div>
          </StepShell>
        )}
      </div>

      {/* Nav */}
      <div className="mt-8 flex items-center justify-between border-t border-outline-variant/40 pt-6">
        <button
          type="button"
          onClick={back}
          disabled={step === 0}
          className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-40"
        >
          <Icon name="arrow_back" className="text-base" /> Back
        </button>
        {step < steps.length - 1 ? (
          <button
            type="button"
            onClick={next}
            disabled={!canContinue}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container disabled:opacity-40"
          >
            Continue <Icon name="arrow_forward" className="text-base" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-60"
          >
            {pending ? (
              <Icon name="progress_activity" className="animate-spin text-base" />
            ) : (
              <Icon name="publish" className="text-base" />
            )}
            {mode === "edit" ? "Save Changes" : "Publish Package"}
          </button>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-[var(--font-heading)] text-2xl text-on-surface">{title}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

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

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
      >
        {children}
      </select>
      <Icon
        name="expand_more"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
      />
    </div>
  );
}

function ToggleCustom({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="mt-1.5 flex items-center gap-2 text-xs text-on-surface-variant">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 accent-secondary"
      />
      {label}
    </label>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-on-surface">{value}</dd>
    </div>
  );
}
