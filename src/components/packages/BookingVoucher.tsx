"use client";

import { site } from "@/data/site";
import { formatDate, formatPkr } from "@/lib/format";
import type { BookingData } from "./BookNow";

/**
 * The printable booking voucher — this is what becomes the customer's PDF.
 *
 * It is rendered into the page (hidden on screen) and revealed only for
 * `@media print`, so the browser's own "Save as PDF" produces it. That is a
 * deliberate choice over a PDF library: the voucher carries Urdu, and no
 * JS PDF writer available to us performs Arabic/Urdu contextual shaping —
 * letters come out isolated and left-to-right. The browser shapes the script
 * correctly and keeps the WhatsApp link as a real, clickable annotation.
 *
 * Styling is deliberately light-on-white and uses plain hex rather than the
 * dark design tokens: this is a document to be kept or printed, not a screen.
 */

export const VOUCHER_PRINT_ID = "booking-voucher-print";

export const RESERVED_MESSAGE_EN =
  "Your seat has been reserved. To confirm your booking, please contact us on WhatsApp.";
export const RESERVED_MESSAGE_UR =
  "آپ کی سیٹ ریزرو کر دی گئی ہے۔ اپنی بکنگ کی تصدیق کے لیے براہِ کرم واٹس ایپ پر ہم سے رابطہ کریں۔";

export interface VoucherDetails {
  reference: string;
  total: number;
  name: string;
  phone: string;
  roomType: string;
  adults: number;
  childNoBed: number;
  infants: number;
  unitPrice: number;
}

export function BookingVoucher({
  booking,
  details,
  whatsappHref,
}: {
  booking: BookingData;
  details: VoucherDetails;
  whatsappHref: string;
}) {
  const d = booking.details;

  const partyRows = [
    { label: "Adults", qty: details.adults, each: details.unitPrice },
    booking.childNoBedPrice > 0 && details.childNoBed > 0
      ? { label: "Child (no bed)", qty: details.childNoBed, each: booking.childNoBedPrice }
      : null,
    booking.infantPrice > 0 && details.infants > 0
      ? { label: "Infant (under 2)", qty: details.infants, each: booking.infantPrice }
      : null,
  ].filter(Boolean) as { label: string; qty: number; each: number }[];

  return (
    <div id={VOUCHER_PRINT_ID} className="voucher-sheet" aria-hidden="true">
      {/* Header */}
      <div className="voucher-head">
        <div>
          <p className="voucher-brand">{site.name}</p>
          <p className="voucher-sub">{site.tagline}</p>
        </div>
        <div className="voucher-head-right">
          <p className="voucher-sub">Booking Reference</p>
          <p className="voucher-ref">{details.reference}</p>
        </div>
      </div>

      <p className="voucher-basmala" lang="ar" dir="rtl">
        بسم الله الرحمن الرحيم
      </p>

      {/* Status message — the point of the document */}
      <div className="voucher-notice">
        <p className="voucher-notice-en">{RESERVED_MESSAGE_EN}</p>
        <p className="voucher-notice-ur" lang="ur" dir="rtl">
          {RESERVED_MESSAGE_UR}
        </p>
      </div>

      {/* Package */}
      <h2 className="voucher-h2">Package Details</h2>
      <table className="voucher-table">
        <tbody>
          <Row label="Package" value={booking.heading} />
          {d?.packageCode && <Row label="Package Code" value={d.packageCode} />}
          <Row label="Airline" value={booking.airline} />
          {d?.departureCity && <Row label="Departure City" value={d.departureCity} />}
          <Row label="Departure Date" value={formatDate(booking.departureDate)} />
          {d?.returnDate && <Row label="Return Date" value={formatDate(d.returnDate)} />}
          {d?.durationDays ? <Row label="Duration" value={`${d.durationDays} days`} /> : null}
          {d?.makkahHotel && (
            <Row
              label="Makkah Hotel"
              value={`${d.makkahHotel}${d.makkahNights ? ` — ${d.makkahNights} nights` : ""}`}
            />
          )}
          {d?.madinahHotel && (
            <Row
              label="Madinah Hotel"
              value={`${d.madinahHotel}${d.madinahNights ? ` — ${d.madinahNights} nights` : ""}`}
            />
          )}
          {d?.flightRoute && <Row label="Flight Route" value={d.flightRoute} />}
          {d?.flightOutboundNo && (
            <Row
              label="Flight No."
              value={[d.flightOutboundNo, d.flightInboundNo].filter(Boolean).join("  /  ")}
            />
          )}
          {d?.baggage && <Row label="Baggage" value={d.baggage} />}
        </tbody>
      </table>

      {/* Traveller */}
      <h2 className="voucher-h2">Traveller</h2>
      <table className="voucher-table">
        <tbody>
          <Row label="Name" value={details.name} />
          <Row label="Phone" value={details.phone} />
          <Row label="Room / Sharing" value={details.roomType} />
        </tbody>
      </table>

      {/* Costing */}
      <h2 className="voucher-h2">Costing</h2>
      <table className="voucher-table voucher-costing">
        <thead>
          <tr>
            <th>Travellers</th>
            <th className="num">Qty</th>
            <th className="num">Per person</th>
            <th className="num">Amount</th>
          </tr>
        </thead>
        <tbody>
          {partyRows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td className="num">{r.qty}</td>
              <td className="num">{formatPkr(r.each)}</td>
              <td className="num">{formatPkr(r.each * r.qty)}</td>
            </tr>
          ))}
          <tr className="voucher-total">
            <td colSpan={3}>Total</td>
            <td className="num">{formatPkr(details.total)}</td>
          </tr>
        </tbody>
      </table>

      {/* WhatsApp button — a real link, so it stays clickable in the saved PDF */}
      <a className="voucher-wa" href={whatsappHref}>
        Confirm on WhatsApp — {site.phone}
      </a>

      <div className="voucher-foot">
        <p>
          {site.address} · {site.phone}
        </p>
        <p>
          This voucher confirms a seat reservation only. Your booking is confirmed once our team
          contacts you on WhatsApp.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <tr>
      <th>{label}</th>
      <td>{value}</td>
    </tr>
  );
}
