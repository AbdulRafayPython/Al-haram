"use client";

import { useEffect, useState, useTransition } from "react";
import { Icon } from "@/components/ui/Icon";
import { clsx } from "@/lib/clsx";
import { formatPkr } from "@/lib/format";
import { site } from "@/data/site";
import type { RoomType } from "@/data/types";
import { createBookingAction } from "@/lib/actions/booking";

export interface BookingData {
  packageId: string;
  heading: string;
  airline: string;
  departureDate: string;
  fromPrice: number;
  roomTypes: RoomType[];
  prices: Record<RoomType, number>;
  infantPrice: number;
}

interface Result {
  reference: string;
  total: number;
}

export function BookNow({
  soldOut,
  booking,
  fullWidth,
}: {
  soldOut: boolean;
  booking: BookingData;
  fullWidth?: boolean;
}) {
  const [open, setOpen] = useState(false);

  if (soldOut) {
    return (
      <span
        className={clsx(
          "inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg border border-outline-variant px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-surface-variant",
          fullWidth && "w-full justify-center",
        )}
      >
        <Icon name="event_busy" className="text-base" />
        Sold Out
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex items-center gap-1.5 rounded-lg bg-secondary-fixed px-6 py-2.5 text-xs font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105",
          fullWidth && "w-full justify-center",
        )}
      >
        Book Now
        <Icon name="arrow_forward" className="text-base" />
      </button>
      {open && <BookingModal booking={booking} onClose={() => setOpen(false)} />}
    </>
  );
}

function BookingModal({ booking, onClose }: { booking: BookingData; onClose: () => void }) {
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [roomType, setRoomType] = useState<RoomType>(booking.roomTypes[0] ?? "Quad");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [pending, startTransition] = useTransition();

  // Lock body scroll + close on Escape while the modal is open.
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

  const unitPrice = booking.prices[roomType] ?? booking.fromPrice;
  const payingHeads = adults + children;
  const estTotal = unitPrice * payingHeads + booking.infantPrice * infants;

  function confirm() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await createBookingAction({
          packageId: booking.packageId,
          name,
          phone,
          adults,
          children,
          infants,
          roomType,
        });
        setResult({ reference: res.reference, total: res.total });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not create booking. Please try again.");
      }
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Book ${booking.heading}`}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-outline-variant/50 bg-surface p-6 shadow-2xl"
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

        {result ? (
          <PaymentStep booking={booking} result={result} />
        ) : (
          <>
            <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-secondary">
              {booking.airline}
            </p>
            <h3 className="mt-0.5 font-[var(--font-heading)] text-xl text-on-surface">
              Book {booking.heading}
            </h3>

            <div className="mt-5 space-y-4">
              <Counter label="Adults" hint="12+ years" value={adults} min={1} onChange={setAdults} />
              <Counter label="Children" hint="2–11 years" value={children} min={0} onChange={setChildren} />
              <Counter label="Infants" hint="Under 2" value={infants} min={0} onChange={setInfants} />

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
                  Room / sharing type
                </span>
                <div className="relative">
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value as RoomType)}
                    className="w-full appearance-none rounded-lg border border-outline-variant bg-surface-container px-4 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    {booking.roomTypes.map((r) => (
                      <option key={r} value={r}>
                        {r} — {formatPkr(booking.prices[r] ?? 0)} / person
                      </option>
                    ))}
                  </select>
                  <Icon
                    name="expand_more"
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xl text-on-surface-variant"
                  />
                </div>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Full name" value={name} onChange={setName} placeholder="Your name" />
                <Input label="Phone" value={phone} onChange={setPhone} placeholder="03xx-xxxxxxx" />
              </div>
            </div>

            {/* Live total */}
            <div className="mt-5 flex items-center justify-between rounded-xl border border-secondary/40 bg-secondary-container/25 px-4 py-3">
              <div>
                <p className="text-[0.7rem] uppercase tracking-wider text-on-surface-variant">Total amount</p>
                <p className="text-[0.7rem] text-on-surface-variant">
                  {payingHeads} × {formatPkr(unitPrice)}
                  {infants > 0 && ` + ${infants} infant`}
                </p>
              </div>
              <p className="font-[var(--font-heading)] text-2xl tabular-nums text-secondary">
                {formatPkr(estTotal)}
              </p>
            </div>

            {error && (
              <p className="mt-3 flex items-center gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
                <Icon name="error" className="text-base" />
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={confirm}
              disabled={pending || adults < 1}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-secondary-fixed px-6 py-3 text-sm font-semibold uppercase tracking-widest text-on-secondary-fixed transition-all hover:brightness-105 disabled:opacity-60"
            >
              {pending ? (
                <Icon name="progress_activity" className="animate-spin text-base" />
              ) : (
                <Icon name="qr_code_2" className="text-base" />
              )}
              Confirm & Get QR
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PaymentStep({ booking, result }: { booking: BookingData; result: Result }) {
  const [qrOk, setQrOk] = useState(true);
  const waHref = `${site.whatsappHref}?text=${encodeURIComponent(
    `Booking ${result.reference} for ${booking.heading} — I've paid, sharing the receipt.`,
  )}`;

  return (
    <div className="text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
        <Icon name="check_circle" className="text-3xl" />
      </span>
      <h3 className="mt-3 font-[var(--font-heading)] text-xl text-on-surface">Booking reserved</h3>
      <p className="mt-1 text-sm text-on-surface-variant">
        Reference <span className="font-semibold text-on-surface">{result.reference}</span>
      </p>

      <div className="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-xl border border-outline-variant/50 bg-white p-2">
        {qrOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={site.paymentQrSrc}
            alt="Scan to pay"
            className="h-full w-full object-contain"
            onError={() => setQrOk(false)}
          />
        ) : (
          <span className="px-4 text-center text-xs text-neutral-500">
            Payment QR not configured yet. Please contact us to complete payment.
          </span>
        )}
      </div>

      <p className="mt-4 text-sm text-on-surface-variant">Amount to pay</p>
      <p className="font-[var(--font-heading)] text-2xl tabular-nums text-secondary">
        {formatPkr(result.total)}
      </p>
      <p className="mt-3 text-xs text-on-surface-variant">
        Scan the QR to pay, then send us your receipt so we can confirm your seats.
      </p>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-whatsapp px-6 py-3 text-sm font-semibold text-white transition-all hover:brightness-105"
      >
        <Icon name="chat" className="text-base" />
        Send payment receipt
      </a>
    </div>
  );
}

function Counter({
  label,
  hint,
  value,
  min,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-on-surface">{label}</p>
        <p className="text-[0.7rem] text-on-surface-variant">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition-colors hover:border-secondary disabled:opacity-40"
          aria-label={`Decrease ${label}`}
        >
          <Icon name="remove" className="text-base" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-on-surface">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-outline-variant text-on-surface transition-colors hover:border-secondary"
          aria-label={`Increase ${label}`}
        >
          <Icon name="add" className="text-base" />
        </button>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-outline-variant bg-surface-container px-3 py-2.5 text-sm text-on-surface focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
      />
    </label>
  );
}
