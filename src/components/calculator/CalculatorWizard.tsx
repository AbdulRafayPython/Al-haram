"use client";

import { useMemo, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { formatPkr, formatSar, formatNumber } from "@/lib/format";
import { site } from "@/data/site";
import type { Hotel, Visa } from "@/data/types";

/** SAR → PKR conversion used for the estimate (configurable). */
const SAR_TO_PKR = 75;

const roomOptions = [
  { key: "double", label: "Double", occupancy: 2 },
  { key: "triple", label: "Triple", occupancy: 3 },
  { key: "quad", label: "Quad", occupancy: 4 },
] as const;

type RoomKey = (typeof roomOptions)[number]["key"];

const steps = ["Travelers", "Visa", "Makkah", "Madinah", "Estimate"] as const;

export function CalculatorWizard({ hotels, visas }: { hotels: Hotel[]; visas: Visa[] }) {
  const [step, setStep] = useState(0);

  const makkahHotels = useMemo(() => hotels.filter((h) => h.city === "Makkah"), [hotels]);
  const madinahHotels = useMemo(() => hotels.filter((h) => h.city === "Madinah"), [hotels]);

  // Travelers
  const [withBed, setWithBed] = useState(2);
  const [withoutBed, setWithoutBed] = useState(0);
  const [infants, setInfants] = useState(0);

  // Visa
  const [visaId, setVisaId] = useState(visas[1].id);

  // Hotels
  const [makkahId, setMakkahId] = useState(makkahHotels[0].id);
  const [makkahNights, setMakkahNights] = useState(5);
  const [makkahRoom, setMakkahRoom] = useState<RoomKey>("quad");

  const [madinahId, setMadinahId] = useState(madinahHotels[0].id);
  const [madinahNights, setMadinahNights] = useState(3);
  const [madinahRoom, setMadinahRoom] = useState<RoomKey>("quad");

  const visa = visas.find((v) => v.id === visaId)!;
  const makkah = makkahHotels.find((h) => h.id === makkahId)!;
  const madinah = madinahHotels.find((h) => h.id === madinahId)!;

  const estimate = useMemo(() => {
    const visaCount = withBed + withoutBed; // infants assumed visa-exempt
    const visaTotalPkr = visa.pricePkr * visaCount;

    const calcHotel = (hotel: Hotel, nights: number, room: RoomKey) => {
      const occupancy = roomOptions.find((r) => r.key === room)!.occupancy;
      // Only passengers with a bed drive room count.
      const rooms = Math.max(1, Math.ceil(withBed / occupancy));
      const rate = hotel.rates[room];
      const sar = rate * rooms * nights;
      return { rooms, rate, sar };
    };

    const mk = calcHotel(makkah, makkahNights, makkahRoom);
    const md = calcHotel(madinah, madinahNights, madinahRoom);

    const hotelSar = mk.sar + md.sar;
    const hotelPkr = hotelSar * SAR_TO_PKR;
    const grandPkr = visaTotalPkr + hotelPkr;

    return {
      visaCount,
      visaTotalPkr,
      mk,
      md,
      hotelSar,
      grandPkr,
      totalTravelers: withBed + withoutBed + infants,
    };
  }, [withBed, withoutBed, infants, visa, makkah, makkahNights, makkahRoom, madinah, madinahNights, madinahRoom]);

  const next = () => setStep((s) => Math.min(s + 1, steps.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
      {/* Wizard */}
      <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-6 md:p-8">
        {/* Progress */}
        <ol className="mb-8 flex items-center">
          {steps.map((label, i) => (
            <li key={label} className="flex flex-1 items-center last:flex-none">
              <button
                onClick={() => setStep(i)}
                className="flex flex-col items-center gap-1.5"
                aria-current={i === step}
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
                  className={clsx(
                    "mx-2 h-0.5 flex-1 rounded-full",
                    i < step ? "bg-success" : "bg-surface-container",
                  )}
                />
              )}
            </li>
          ))}
        </ol>

        {/* Step content */}
        <div className="min-h-[300px]">
          {step === 0 && (
            <StepShell title="Who is travelling?" subtitle="Tell us how many travelers and bed requirements.">
              <div className="space-y-4">
                <Counter label="Passengers with bed" hint="Each occupies a hotel bed" value={withBed} onChange={setWithBed} min={1} />
                <Counter label="Passengers without bed" hint="Share an existing bed — no extra room cost" value={withoutBed} onChange={setWithoutBed} />
                <Counter label="Infants" hint="Under 2 years, visa-exempt" value={infants} onChange={setInfants} />
              </div>
            </StepShell>
          )}

          {step === 1 && (
            <StepShell title="Choose a visa" subtitle="Per-person price, taxes included.">
              <div className="space-y-3">
                {visas.map((v) => (
                  <label
                    key={v.id}
                    className={clsx(
                      "flex cursor-pointer items-center justify-between rounded-xl border p-4 transition-colors",
                      visaId === v.id
                        ? "border-secondary bg-secondary-container/40"
                        : "border-outline-variant/50 hover:border-secondary/40",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="visa"
                        checked={visaId === v.id}
                        onChange={() => setVisaId(v.id)}
                        className="h-4 w-4 accent-primary"
                      />
                      <div>
                        <p className="font-semibold text-on-surface">{v.validityDays} Days Umrah Visa</p>
                        <p className="text-xs text-on-surface-variant">
                          {v.mode} · ~{v.processingDays} day processing
                        </p>
                      </div>
                    </div>
                    <span className="font-[var(--font-heading)] text-lg text-on-surface">
                      {formatPkr(v.pricePkr)}
                    </span>
                  </label>
                ))}
              </div>
            </StepShell>
          )}

          {step === 2 && (
            <HotelStep
              title="Makkah hotel"
              hotels={makkahHotels}
              hotelId={makkahId}
              setHotelId={setMakkahId}
              nights={makkahNights}
              setNights={setMakkahNights}
              room={makkahRoom}
              setRoom={setMakkahRoom}
            />
          )}

          {step === 3 && (
            <HotelStep
              title="Madinah hotel"
              hotels={madinahHotels}
              hotelId={madinahId}
              setHotelId={setMadinahId}
              nights={madinahNights}
              setNights={setMadinahNights}
              room={madinahRoom}
              setRoom={setMadinahRoom}
            />
          )}

          {step === 4 && (
            <StepShell title="Your estimate" subtitle="A clear breakdown of visa and hotel costs.">
              <div className="space-y-3 text-sm">
                <Line label={`Visa × ${estimate.visaCount}`} value={formatPkr(estimate.visaTotalPkr)} />
                <Line
                  label={`${makkah.name} — ${estimate.mk.rooms} room(s) × ${makkahNights} nights`}
                  value={formatSar(estimate.mk.sar)}
                />
                <Line
                  label={`${madinah.name} — ${estimate.md.rooms} room(s) × ${madinahNights} nights`}
                  value={formatSar(estimate.md.sar)}
                />
                <div className="flex items-center justify-between border-t border-outline-variant/40 pt-3 text-on-surface-variant">
                  <span>Hotels subtotal</span>
                  <span>{formatSar(estimate.hotelSar)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Exchange rate</span>
                  <span>1 SAR = {SAR_TO_PKR} PKR</span>
                </div>
              </div>
            </StepShell>
          )}
        </div>

        {/* Nav */}
        <div className="mt-8 flex items-center justify-between border-t border-outline-variant/40 pt-6">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-lg px-5 py-2.5 text-sm font-semibold text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-40"
          >
            <Icon name="arrow_back" className="text-base" /> Back
          </button>
          {step < steps.length - 1 ? (
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-primary transition-colors hover:bg-primary-container"
            >
              Continue <Icon name="arrow_forward" className="text-base" />
            </button>
          ) : (
            <a
              href={`${site.whatsappHref}?text=${encodeURIComponent(
                `Umrah quote request — ${estimate.totalTravelers} travelers, ${visa.validityDays}-day visa, ${makkah.name} (${makkahNights}n), ${madinah.name} (${madinahNights}n). Estimated ${formatPkr(estimate.grandPkr)}.`,
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-6 py-2.5 text-sm font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105"
            >
              <Icon name="chat" className="text-base" /> Send to Consultant
            </a>
          )}
        </div>
      </div>

      {/* Live summary */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-2xl border border-outline-variant/40 bg-primary text-on-primary">
          <div className="border-b border-on-primary/10 px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-on-primary/60">Estimated Total</p>
            <p className="mt-1 font-[var(--font-heading)] text-3xl text-secondary-fixed">
              {formatPkr(estimate.grandPkr)}
            </p>
            <p className="mt-1 text-xs text-on-primary/60">
              for {estimate.totalTravelers} traveler(s)
            </p>
          </div>
          <dl className="space-y-3 px-6 py-5 text-sm">
            <SummaryRow label="Travelers" value={`${formatNumber(estimate.totalTravelers)} total`} />
            <SummaryRow label="Visa" value={`${visa.validityDays} days`} />
            <SummaryRow label="Makkah" value={`${makkahNights} nights`} />
            <SummaryRow label="Madinah" value={`${madinahNights} nights`} />
            <SummaryRow label="Hotels (SAR)" value={formatSar(estimate.hotelSar)} />
          </dl>
          <p className="px-6 pb-5 text-xs leading-relaxed text-on-primary/50">
            Estimate only. Final pricing depends on availability, room allocation, and live
            exchange rates. Hotel cost is based on passengers with a bed.
          </p>
        </div>
      </aside>
    </div>
  );
}

/* ---------- Sub-components ---------- */

function StepShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="font-[var(--font-heading)] text-2xl text-on-surface">{title}</h2>
      <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function HotelStep({
  title,
  hotels,
  hotelId,
  setHotelId,
  nights,
  setNights,
  room,
  setRoom,
}: {
  title: string;
  hotels: Hotel[];
  hotelId: string;
  setHotelId: (v: string) => void;
  nights: number;
  setNights: (v: number) => void;
  room: RoomKey;
  setRoom: (v: RoomKey) => void;
}) {
  return (
    <StepShell title={title} subtitle="Select a property, room type, and number of nights.">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Hotel
          </span>
          <div className="relative">
            <select
              value={hotelId}
              onChange={(e) => setHotelId(e.target.value)}
              className="w-full appearance-none rounded-lg border border-outline-variant bg-surface px-4 py-2.5 text-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            >
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} — {h.distance}
                </option>
              ))}
            </select>
            <Icon
              name="expand_more"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
            />
          </div>
        </label>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            Room type (SAR / night)
          </span>
          <div className="grid grid-cols-3 gap-3">
            {roomOptions.map((r) => {
              const hotel = hotels.find((h) => h.id === hotelId)!;
              return (
                <button
                  key={r.key}
                  onClick={() => setRoom(r.key)}
                  className={clsx(
                    "rounded-xl border p-3 text-center transition-colors",
                    room === r.key
                      ? "border-secondary bg-secondary-container"
                      : "border-outline-variant/50 hover:border-secondary/40",
                  )}
                >
                  <p className="text-sm font-semibold text-on-surface">{r.label}</p>
                  <p className="text-xs text-on-surface-variant">{formatSar(hotel.rates[r.key])}</p>
                </button>
              );
            })}
          </div>
        </div>

        <Counter label="Number of nights" value={nights} onChange={setNights} min={1} />
      </div>
    </StepShell>
  );
}

function Counter({
  label,
  hint,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant/50 p-4">
      <div>
        <p className="font-medium text-on-surface">{label}</p>
        {hint && <p className="text-xs text-on-surface-variant">{hint}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          aria-label={`Decrease ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-colors hover:bg-surface-container disabled:opacity-40"
          disabled={value <= min}
        >
          <Icon name="remove" className="text-lg" />
        </button>
        <span className="w-6 text-center font-semibold text-on-surface">{value}</span>
        <button
          onClick={() => onChange(value + 1)}
          aria-label={`Increase ${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-outline-variant text-on-surface transition-colors hover:bg-surface-container"
        >
          <Icon name="add" className="text-lg" />
        </button>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-semibold text-on-surface">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-on-primary/60">{label}</dt>
      <dd className="font-medium text-on-primary">{value}</dd>
    </div>
  );
}
