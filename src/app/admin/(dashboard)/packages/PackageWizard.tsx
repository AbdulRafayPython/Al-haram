"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { formatPkr } from "@/lib/format";
import { ROOM_TYPES, type RoomType } from "@/data/types";
import { getFlightIssues } from "@/lib/flight";
import {
  createAirlineAction,
  createCityAction,
  createPackageAction,
  updatePackageAction,
  type PackageFormInput,
} from "@/app/admin/actions";
import type { HotelOption } from "@/lib/data/packages";
import type { CityOption } from "@/lib/data/cities";

const steps = ["Route & Airline", "Hotels & Stay", "Flight Details", "Pricing & Seats", "Review"] as const;

/** Auto-suggested package/group codes (module scope so the timestamp read isn't in render). */
function autoCodes(existingGroup: string | null): { packageCode: string; groupCode: string } {
  const serial = Date.now().toString().slice(-5);
  return { packageCode: `UP-${serial}`, groupCode: existingGroup ?? `UG-${serial}` };
}

const emptyForm = (hotelOptions: HotelOption[], airlines: string[], cities: CityOption[]): PackageFormInput => {
  const makkah = hotelOptions.find((h) => h.city === "Makkah");
  const madinah = hotelOptions.find((h) => h.city === "Madinah");
  const firstCity = cities[0];
  const code = firstCity?.code ?? "";
  return {
    title: "",
    airline: airlines[0] ?? "",
    departureCity: firstCity ? `${firstCity.name} (${code})` : "",
    departureCityCode: code,
    durationDays: 14,
    departureDate: "",
    makkahHotelId: makkah?.id ?? null,
    madinahHotelId: madinah?.id ?? null,
    makkahNights: 8,
    madinahNights: 6,
    roomTypes: ["Quad"],
    priceSharing: 0,
    priceQuad: null,
    priceTriple: null,
    priceDouble: null,
    priceInfant: 75000,
    priceChildNoBed: null,
    seatsTotal: 40,
    seatsAvailable: 40,
    packageCode: null,
    groupCode: null,
    flightRoute: code ? `${code} → JED → ${code}` : null,
    flightOutboundNo: null,
    flightInboundNo: null,
    flightDepartureTime: null,
    flightArrivalTime: null,
    flightDepartureDate: null,
    flightArrivalDate: null,
    featured: false,
  };
};

/** Strip a trailing " (CODE)" suffix so a fallback dropdown entry shows just the city name. */
function stripCityCode(label: string): string {
  return label.replace(/\s*\([^)]*\)\s*$/, "");
}

export function PackageWizard({
  hotelOptions,
  airlines,
  cities,
  mode,
  packageId,
  initialValues,
}: {
  hotelOptions: HotelOption[];
  airlines: string[];
  cities: CityOption[];
  mode: "create" | "edit";
  packageId?: string;
  initialValues?: PackageFormInput;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<PackageFormInput>(
    initialValues ?? emptyForm(hotelOptions, airlines, cities),
  );

  // Airlines are DB-backed; keep a local copy so a freshly-added one shows immediately.
  const [airlineList, setAirlineList] = useState<string[]>(() =>
    initialValues && initialValues.airline && !airlines.includes(initialValues.airline)
      ? [...airlines, initialValues.airline]
      : airlines,
  );
  const [addingAirline, setAddingAirline] = useState(false);
  const [newAirline, setNewAirline] = useState("");
  const [airlineError, setAirlineError] = useState<string | null>(null);
  const [airlinePending, startAirlineTransition] = useTransition();

  // Cities are DB-backed the same way as airlines.
  const [cityList, setCityList] = useState<CityOption[]>(() =>
    initialValues &&
    initialValues.departureCityCode &&
    !cities.some((c) => c.code === initialValues.departureCityCode)
      ? [...cities, { code: initialValues.departureCityCode, name: stripCityCode(initialValues.departureCity) }]
      : cities,
  );
  const [addingCity, setAddingCity] = useState(false);
  const [newCityName, setNewCityName] = useState("");
  const [newCityCode, setNewCityCode] = useState("");
  const [cityError, setCityError] = useState<string | null>(null);
  const [cityPending, startCityTransition] = useTransition();

  const makkahHotels = useMemo(() => hotelOptions.filter((h) => h.city === "Makkah"), [hotelOptions]);
  const madinahHotels = useMemo(() => hotelOptions.filter((h) => h.city === "Madinah"), [hotelOptions]);

  function set<K extends keyof PackageFormInput>(key: K, value: PackageFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleRoomType(r: RoomType) {
    setForm((f) => {
      const selected = new Set(f.roomTypes as RoomType[]);
      if (selected.has(r)) selected.delete(r);
      else selected.add(r);
      return { ...f, roomTypes: ROOM_TYPES.filter((x) => selected.has(x)) };
    });
  }

  function priceFor(r: RoomType): number | null {
    switch (r) {
      case "Sharing":
        return form.priceSharing;
      case "Quad":
        return form.priceQuad;
      case "Triple":
        return form.priceTriple;
      case "Double":
        return form.priceDouble;
    }
  }

  function setPriceFor(r: RoomType, value: number | null) {
    if (r === "Sharing") set("priceSharing", value ?? 0);
    else if (r === "Quad") set("priceQuad", value);
    else if (r === "Triple") set("priceTriple", value);
    else set("priceDouble", value);
  }

  function handleAddAirline() {
    const name = newAirline.trim();
    if (!name) return;
    setAirlineError(null);
    startAirlineTransition(async () => {
      try {
        const { name: saved } = await createAirlineAction(name);
        setAirlineList((list) => (list.includes(saved) ? list : [...list, saved]));
        set("airline", saved);
        setAddingAirline(false);
        setNewAirline("");
      } catch (e) {
        setAirlineError(e instanceof Error ? e.message : "Could not add airline.");
      }
    });
  }

  function handleAddCity() {
    const name = newCityName.trim();
    const code = newCityCode.trim().toUpperCase();
    if (!name || !code) return;
    setCityError(null);
    startCityTransition(async () => {
      try {
        const saved = await createCityAction(name, code);
        setCityList((list) => (list.some((c) => c.code === saved.code) ? list : [...list, saved]));
        set("departureCityCode", saved.code);
        set("departureCity", `${saved.name} (${saved.code})`);
        set("flightRoute", `${saved.code} → JED → ${saved.code}`);
        setAddingCity(false);
        setNewCityName("");
        setNewCityCode("");
      } catch (e) {
        setCityError(e instanceof Error ? e.message : "Could not add city.");
      }
    });
  }

  const flightIssues = useMemo(
    () =>
      getFlightIssues({
        outboundNo: form.flightOutboundNo,
        inboundNo: form.flightInboundNo,
        departureTime: form.flightDepartureTime,
        arrivalTime: form.flightArrivalTime,
      }),
    [form.flightOutboundNo, form.flightInboundNo, form.flightDepartureTime, form.flightArrivalTime],
  );
  const blockingIssues = flightIssues.filter((i) => i.kind === "block");
  const overrideIssues = flightIssues.filter((i) => i.kind === "override");

  const offeredPricesValid =
    form.roomTypes.length > 0 && form.roomTypes.every((r) => (priceFor(r as RoomType) ?? 0) > 0);

  const canContinue = (() => {
    if (step === 0) {
      return Boolean(form.title.trim() && form.airline.trim() && form.departureDate && form.durationDays > 0);
    }
    if (step === 1) {
      return Boolean(form.makkahHotelId && form.madinahHotelId && form.makkahNights >= 0 && form.madinahNights >= 0);
    }
    if (step === 2) {
      return blockingIssues.length === 0;
    }
    if (step === 3) {
      return (
        offeredPricesValid &&
        form.seatsTotal >= 0 &&
        form.seatsAvailable >= 0 &&
        form.seatsAvailable <= form.seatsTotal
      );
    }
    return true;
  })();

  const next = () => {
    setError(null);
    if (step === 2 && overrideIssues.length > 0) {
      const proceed = window.confirm(
        `${overrideIssues.map((o) => `• ${o.message}`).join("\n")}\n\nContinue anyway?`,
      );
      if (!proceed) return;
    }
    if (step === steps.length - 2 && !form.packageCode) {
      setForm((f) => ({ ...f, ...autoCodes(f.groupCode) }));
    }
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const makkahHotelName = makkahHotels.find((h) => h.id === form.makkahHotelId)?.name ?? "Select a hotel";
  const madinahHotelName = madinahHotels.find((h) => h.id === form.madinahHotelId)?.name ?? "Select a hotel";

  const offeredPrices = form.roomTypes
    .map((r) => priceFor(r as RoomType))
    .filter((p): p is number => p != null && p > 0);
  const fromPrice = offeredPrices.length ? Math.min(...offeredPrices) : 0;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      try {
        if (mode === "edit" && packageId) {
          await updatePackageAction(packageId, form);
        } else {
          await createPackageAction(form);
        }
        // Navigate only after a clean (non-throwing) save — the actions
        // themselves don't call redirect() (see the note in actions.ts).
        router.push("/admin/packages");
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
            <button type="button" onClick={() => setStep(i)} className="flex flex-col items-center gap-1.5">
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
                  <Select
                    value={form.departureCityCode}
                    onChange={(v) => {
                      const city = cityList.find((c) => c.code === v);
                      if (!city) return;
                      set("departureCityCode", city.code);
                      set("departureCity", `${city.name} (${city.code})`);
                      set("flightRoute", `${city.code} → JED → ${city.code}`);
                    }}
                  >
                    {cityList.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </Select>
                  {!addingCity ? (
                    <button
                      type="button"
                      onClick={() => setAddingCity(true)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                    >
                      <Icon name="add" className="text-sm" /> Add a new city
                    </button>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newCityName}
                        onChange={(e) => setNewCityName(e.target.value)}
                        placeholder="City name"
                        className={inputClass}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCity();
                          }
                        }}
                      />
                      <input
                        value={newCityCode}
                        onChange={(e) => setNewCityCode(e.target.value.toUpperCase())}
                        placeholder="Code"
                        maxLength={4}
                        className={clsx(inputClass, "w-20 text-center uppercase")}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCity();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddCity}
                        disabled={cityPending || !newCityName.trim() || !newCityCode.trim()}
                        className="shrink-0 rounded-lg bg-secondary-fixed px-3 py-2 text-sm font-semibold text-on-secondary-fixed disabled:opacity-50"
                      >
                        {cityPending ? <Icon name="progress_activity" className="animate-spin text-base" /> : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingCity(false);
                          setNewCityName("");
                          setNewCityCode("");
                          setCityError(null);
                        }}
                        className="shrink-0 rounded-lg px-2 text-sm text-on-surface-variant hover:text-on-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {cityError && <p className="mt-1 text-xs text-error">{cityError}</p>}
                </Field>

                <Field label="Airline">
                  <Select value={form.airline} onChange={(v) => set("airline", v)}>
                    {airlineList.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </Select>
                  {!addingAirline ? (
                    <button
                      type="button"
                      onClick={() => setAddingAirline(true)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-secondary hover:underline"
                    >
                      <Icon name="add" className="text-sm" /> Add a new airline
                    </button>
                  ) : (
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newAirline}
                        onChange={(e) => setNewAirline(e.target.value)}
                        placeholder="New airline name"
                        className={inputClass}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddAirline();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddAirline}
                        disabled={airlinePending || !newAirline.trim()}
                        className="shrink-0 rounded-lg bg-secondary-fixed px-3 py-2 text-sm font-semibold text-on-secondary-fixed disabled:opacity-50"
                      >
                        {airlinePending ? <Icon name="progress_activity" className="animate-spin text-base" /> : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingAirline(false);
                          setNewAirline("");
                          setAirlineError(null);
                        }}
                        className="shrink-0 rounded-lg px-2 text-sm text-on-surface-variant hover:text-on-surface"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {airlineError && <p className="mt-1 text-xs text-error">{airlineError}</p>}
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
                  placeholder="e.g. KHI → JED → KHI"
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
                <Field label="Departure date">
                  <input
                    type="date"
                    value={form.flightDepartureDate ?? ""}
                    onChange={(e) => set("flightDepartureDate", e.target.value || null)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Departure time (from Pakistan)">
                  <input
                    type="time"
                    value={form.flightDepartureTime ?? ""}
                    onChange={(e) => set("flightDepartureTime", e.target.value || null)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Arrival date">
                  <input
                    type="date"
                    value={form.flightArrivalDate ?? ""}
                    onChange={(e) => set("flightArrivalDate", e.target.value || null)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Arrival time (back home)">
                  <input
                    type="time"
                    value={form.flightArrivalTime ?? ""}
                    onChange={(e) => set("flightArrivalTime", e.target.value || null)}
                    className={inputClass}
                  />
                </Field>
              </div>

              {blockingIssues.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                  {blockingIssues.map((issue) => (
                    <p key={issue.code} className="flex items-center gap-2">
                      <Icon name="error" className="text-base" />
                      {issue.message}
                    </p>
                  ))}
                </div>
              )}
              {overrideIssues.length > 0 && (
                <div className="space-y-1.5 rounded-lg border border-secondary/40 bg-secondary-container/30 px-4 py-3 text-sm text-on-secondary-container">
                  {overrideIssues.map((issue) => (
                    <p key={issue.code} className="flex items-center gap-2">
                      <Icon name="warning" className="text-base" />
                      {issue.message} You can still continue.
                    </p>
                  ))}
                </div>
              )}
            </div>
          </StepShell>
        )}

        {step === 3 && (
          <StepShell title="Pricing & Seats" subtitle="Choose the room types offered, then set each per-person price (PKR).">
            <div className="space-y-6">
              <Field label="Room types offered (select all that apply)">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {ROOM_TYPES.map((r) => {
                    const active = form.roomTypes.includes(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => toggleRoomType(r)}
                        className={clsx(
                          "flex items-center justify-center gap-1.5 rounded-xl border p-3 text-center text-sm font-medium transition-colors",
                          active
                            ? "border-secondary bg-secondary-container text-on-secondary-container"
                            : "border-outline-variant/50 text-on-surface-variant hover:border-secondary/40",
                        )}
                      >
                        {active && <Icon name="check" className="text-base" />}
                        {r}
                      </button>
                    );
                  })}
                </div>
              </Field>

              {form.roomTypes.length === 0 ? (
                <p className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
                  Select at least one room type to set its price.
                </p>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {form.roomTypes.map((r) => {
                    const price = priceFor(r as RoomType);
                    return (
                      <Field key={r} label={`${r} — per person (PKR)`}>
                        <input
                          type="number"
                          min={0}
                          value={price ? String(price) : ""}
                          onChange={(e) =>
                            setPriceFor(r as RoomType, e.target.value ? Number(e.target.value) : null)
                          }
                          placeholder="e.g. 285000"
                          className={inputClass}
                        />
                      </Field>
                    );
                  })}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Infant — per person (PKR, optional)">
                  <input
                    type="number"
                    min={0}
                    value={form.priceInfant ?? ""}
                    onChange={(e) => set("priceInfant", e.target.value ? Number(e.target.value) : null)}
                    className={inputClass}
                  />
                </Field>
                <Field label="Child without bed — per person (PKR, optional)">
                  <input
                    type="number"
                    min={0}
                    value={form.priceChildNoBed ?? ""}
                    onChange={(e) =>
                      set("priceChildNoBed", e.target.value ? Number(e.target.value) : null)
                    }
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
                  <SummaryItem label="Room types" value={form.roomTypes.join(", ") || "—"} />
                  <SummaryItem label="From price" value={formatPkr(fromPrice)} />
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

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[0.65rem] uppercase tracking-wider">{label}</dt>
      <dd className="font-medium text-on-surface">{value}</dd>
    </div>
  );
}
