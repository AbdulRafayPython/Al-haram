/**
 * Scrape-a-package: deterministic extraction of ALL packages on a public
 * listing page, plus change-detection against records already in the DB.
 *
 * Listing pages differ per site, so extraction is driven by **per-site adapters**
 * (tuned to a known site's markup) with a **generic fallback** (repeating-block
 * detection) for anything else. Every adapter returns a flat list of loosely
 * typed `RawPackage`s; `rawToDraft` then resolves airline/city/hotel names
 * against the admin's real records, builds a draft in the exact
 * PACKAGE_JSON_SAMPLE shape, and records what was found / still missing.
 *
 * Nothing here is trusted for a write: new packages flow through the same
 * validate → preview → create pipeline as the JSON import, and updates to an
 * existing package only ever patch a whitelisted set of columns server-side.
 *
 * Pure module (no I/O) so it can be unit-tested with the repo's Node type-strip
 * loader. The network fetch lives separately in lib/scrapeFetch.ts.
 */
import { type RoomType } from "@/data/types";
import type { ImportContext } from "@/lib/importPackage";

// --- public types ----------------------------------------------------------

export interface RawPrices {
  sharing?: number;
  quad?: number;
  triple?: number;
  double?: number;
  infant?: number;
  childNoBed?: number;
}

export interface RawFlight {
  route?: string;
  outboundNo?: string;
  inboundNo?: string;
  departureTime?: string;
  arrivalTime?: string;
  departureDate?: string;
  arrivalDate?: string;
}

/** Loose field bag straight from a page block, before resolving to real records. */
export interface RawPackage {
  title?: string;
  cityCode?: string;
  cityName?: string;
  airline?: string;
  departureDate?: string; // ISO
  durationDays?: number;
  makkahHotel?: string;
  madinahHotel?: string;
  makkahNights?: number;
  madinahNights?: number;
  prices?: RawPrices;
  baggage?: string;
  seatsTotal?: number;
  seatsAvailable?: number;
  flight?: RawFlight;
  packageCode?: string;
  groupCode?: string;
}

export interface DraftSummary {
  packageCode: string | null;
  groupCode: string | null;
  title: string;
  departureDate: string | null;
  airline: string | null;
  cityCode: string | null;
  durationDays: number | null;
  seatsTotal: number | null;
  seatsAvailable: number | null;
  prices: {
    sharing: number | null;
    quad: number | null;
    triple: number | null;
    double: number | null;
    infant: number | null;
    childNoBed: number | null;
  };
  flightDepartureTime: string | null;
  flightArrivalTime: string | null;
  makkahHotel: string | null;
  madinahHotel: string | null;
}

export interface ScrapedDraft {
  /** Import-shape JSON, ready for the editor / create pipeline. */
  json: string;
  /** Normalized values used for matching + diffing against the DB. */
  summary: DraftSummary;
  found: string[];
  missing: string[];
  warnings: string[];
}

export interface ScrapeExtractResult {
  /** Which adapter ran: a hostname, or "generic". */
  site: string;
  drafts: ScrapedDraft[];
  /** True when the total was capped (page had more than the limit). */
  truncated: boolean;
  totalOnPage: number;
}

/** A lean view of an existing DB package, for matching + diffing. */
export interface ExistingLite {
  id: string;
  title: string;
  packageCode: string | null;
  groupCode: string | null;
  departureDate: string;
  airline: string;
  cityCode: string;
  durationDays: number;
  seatsTotal: number;
  seatsAvailable: number;
  prices: {
    sharing: number | null;
    quad: number | null;
    triple: number | null;
    double: number | null;
    infant: number | null;
    childNoBed: number | null;
  };
  flightDepartureTime: string | null;
  flightArrivalTime: string | null;
  makkahHotel: string | null;
  madinahHotel: string | null;
}

export interface FieldChange {
  label: string;
  from: string;
  to: string;
}

const MAX_DRAFTS = 800;

// --- shared helpers --------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => cp(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => cp(parseInt(d, 10)));
}

function cp(n: number): string {
  try {
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
  } catch {
    return "";
  }
}

export function htmlToText(html: string): string {
  const noHidden = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ");
  const lineBroken = noHidden
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|header|footer|table|ul|ol|span)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  return decodeEntities(lineBroken.replace(/<[^>]+>/g, " "))
    .split("\n")
    .map((l) => l.replace(/[^\S\n]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 200_000);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** First capture of an HTML attribute (single or double quoted). */
function attr(html: string, name: string): string {
  const m = html.match(new RegExp(`${escapeRegExp(name)}\\s*=\\s*["']([^"']*)["']`, "i"));
  return m ? decodeEntities(m[1]).trim() : "";
}

/** "258,500/-" / "Rs 302,199" → 258500. */
function money(v: string | null | undefined): number | null {
  if (!v) return null;
  const m = v.match(/(\d[\d,]{2,})/);
  if (!m) return null;
  const n = Number(m[1].replace(/,/g, ""));
  return Number.isFinite(n) && n >= 100 && n <= 100_000_000 ? n : null;
}

/** "30 Kg", "7KG+23KG" → "30KG" / "7KG+23KG" (<=40 chars). */
function normBaggage(v: string | null | undefined): string | undefined {
  if (!v) return undefined;
  const t = v.replace(/\s+/g, "").replace(/kgs?/gi, "KG").trim();
  return t && t.length <= 40 && /\d/.test(t) ? t : undefined;
}

/** "10:30 AM" / "20:45" → "HH:MM" (24h). */
function to24h(v: string | null | undefined): string | undefined {
  if (!v) return undefined;
  const m = v.trim().match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/i);
  if (!m) return undefined;
  let h = Number(m[1]);
  const min = Number(m[2]);
  const ap = m[3]?.toLowerCase();
  if (ap === "pm" && h < 12) h += 12;
  if (ap === "am" && h === 12) h = 0;
  if (h > 23 || min > 59) return undefined;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** ISO "2026-08-12" or "27 JUL 2026" / "Aug 22, 2026" → "YYYY-MM-DD". */
function parseLooseDate(v: string | null | undefined): string | undefined {
  if (!v) return undefined;
  const s = v.trim();
  const iso = s.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) return buildIso(+iso[1], +iso[2], +iso[3]);
  let m = s.match(/\b(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{4})\b/i);
  if (m) return buildIso(+m[3], MONTHS[m[2].slice(0, 3).toLowerCase()], +m[1]);
  m = s.match(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/i);
  if (m) return buildIso(+m[3], MONTHS[m[1].slice(0, 3).toLowerCase()], +m[2]);
  return undefined;
}

function buildIso(y: number, mo: number, d: number): string | undefined {
  if (!mo || mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return undefined;
  const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  return Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime()) ? undefined : iso;
}

function stripSimilar(name: string | null | undefined): string {
  return (name ?? "").replace(/\s*\b(or\s+similar|similar)\b\s*$/i, "").replace(/\s+/g, " ").trim();
}

/** Split an HTML string into blocks that each start at a marker occurrence. */
function splitByMarker(html: string, re: RegExp): string[] {
  const idx: number[] = [];
  for (const m of html.matchAll(re)) if (m.index != null) idx.push(m.index);
  const blocks: string[] = [];
  for (let i = 0; i < idx.length; i++) blocks.push(html.slice(idx[i], idx[i + 1] ?? html.length));
  return blocks;
}

// --- record resolution -----------------------------------------------------

function resolveCity(raw: RawPackage, ctx: ImportContext): { code: string; name: string } | null {
  if (raw.cityCode) {
    const c = ctx.cities.find((x) => x.code.toLowerCase() === raw.cityCode!.toLowerCase());
    if (c) return c;
  }
  if (raw.cityName) {
    const nm = raw.cityName.replace(/\s*\([^)]*\)\s*$/, "").trim().toLowerCase();
    const c = ctx.cities.find((x) => x.name.toLowerCase() === nm);
    if (c) return c;
  }
  return null;
}

function resolveAirline(raw: string | undefined, airlines: string[]): string | null {
  if (!raw) return null;
  const cleaned = raw.replace(/^[A-Za-z0-9]{1,3}\s*-\s*/, "").trim(); // strip "PK-", "SV - "
  for (const c of [raw.trim(), cleaned]) {
    const hit = airlines.find((a) => a.toLowerCase() === c.toLowerCase());
    if (hit) return hit;
  }
  for (const c of [cleaned, raw.trim()]) {
    if (c.length < 4) continue;
    const hit = airlines.find(
      (a) => a.toLowerCase().includes(c.toLowerCase()) || c.toLowerCase().includes(a.toLowerCase()),
    );
    if (hit) return hit;
  }
  const rtoks = new Set(cleaned.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
  let best: string | null = null;
  let bestScore = 0;
  for (const a of airlines) {
    const score = a.toLowerCase().split(/\s+/).filter((t) => rtoks.has(t)).length;
    if (score > bestScore) {
      bestScore = score;
      best = a;
    }
  }
  return bestScore >= 1 ? best : null;
}

function resolveHotel(name: string | undefined, city: "Makkah" | "Madinah", ctx: ImportContext): string | null {
  if (!name) return null;
  const n = stripSimilar(name).toLowerCase();
  if (!n) return null;
  const inCity = ctx.hotels.filter((h) => h.city === city);
  let hit = inCity.find((h) => h.name.toLowerCase() === n);
  if (!hit) hit = inCity.find((h) => h.name.toLowerCase().includes(n) || n.includes(h.name.toLowerCase()));
  return hit ? hit.name : null;
}

// --- raw → draft (JSON + summary + found/missing) --------------------------

const TIER_MAP: [keyof RawPrices, RoomType][] = [
  ["sharing", "Sharing"],
  ["quad", "Quad"],
  ["triple", "Triple"],
  ["double", "Double"],
];

export function rawToDraft(raw: RawPackage, ctx: ImportContext): ScrapedDraft {
  const found: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];

  const city = resolveCity(raw, ctx);
  const airline = resolveAirline(raw.airline, ctx.airlines);
  const makkah = resolveHotel(raw.makkahHotel, "Makkah", ctx);
  const madinah = resolveHotel(raw.madinahHotel, "Madinah", ctx);

  const json: Record<string, unknown> = {};
  const title = (raw.title ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  json.title = title;
  json.departureCity = city?.name ?? raw.cityName ?? "";
  json.departureCityCode = city?.code ?? raw.cityCode ?? "";
  json.airline = airline ?? raw.airline ?? "";
  json.departureDate = raw.departureDate ?? "";
  json.durationDays = raw.durationDays ?? null;
  json.makkahHotel = makkah ?? raw.makkahHotel ?? "";
  json.madinahHotel = madinah ?? raw.madinahHotel ?? "";
  if (raw.makkahNights != null) json.makkahNights = raw.makkahNights;
  if (raw.madinahNights != null) json.madinahNights = raw.madinahNights;

  const priceObj: Record<string, number> = {};
  const tiers: RoomType[] = [];
  for (const [k, rt] of TIER_MAP) {
    const v = raw.prices?.[k];
    if (v != null && v > 0) {
      priceObj[k] = v;
      tiers.push(rt);
    }
  }
  if (raw.prices?.infant != null) priceObj.infant = raw.prices.infant;
  if (raw.prices?.childNoBed != null) priceObj.childNoBed = raw.prices.childNoBed;
  json.roomTypes = tiers;
  json.prices = priceObj;

  if (raw.baggage) json.baggage = raw.baggage;
  if (raw.seatsAvailable != null) {
    json.seatsTotal = raw.seatsTotal ?? raw.seatsAvailable;
    json.seatsAvailable = raw.seatsAvailable;
  }

  const f = raw.flight;
  if (f) {
    const fo: Record<string, unknown> = {};
    if (f.route) fo.route = f.route;
    if (f.outboundNo) fo.outboundNo = f.outboundNo;
    if (f.inboundNo) fo.inboundNo = f.inboundNo;
    if (f.departureTime) fo.departureTime = f.departureTime;
    if (f.arrivalTime) fo.arrivalTime = f.arrivalTime;
    if (f.departureDate) fo.departureDate = f.departureDate;
    if (f.arrivalDate) fo.arrivalDate = f.arrivalDate;
    if (Object.keys(fo).length) json.flight = fo;
  }
  if (raw.packageCode) json.packageCode = raw.packageCode;
  if (raw.groupCode) json.groupCode = raw.groupCode;
  json.featured = false;

  // found / missing
  if (title) found.push("title");
  else missing.push("title");
  if (city) found.push(`city (${city.name})`);
  else if (raw.cityCode || raw.cityName)
    missing.push(`city "${raw.cityName ?? raw.cityCode}" — add it under Cities or pick an existing one`);
  else missing.push("departure city");
  if (airline) found.push(`airline (${airline})`);
  else if (raw.airline) missing.push(`airline "${raw.airline}" — add it under Airlines or pick an existing one`);
  else missing.push("airline");
  if (raw.departureDate) found.push("departure date");
  else missing.push("departure date");
  if (raw.durationDays != null) found.push(`duration (${raw.durationDays}d)`);
  else missing.push("duration");
  if (makkah) found.push(`Makkah hotel (${makkah})`);
  else if (raw.makkahHotel) missing.push(`Makkah hotel "${raw.makkahHotel}" — add it under Hotels or pick an existing one`);
  else missing.push("Makkah hotel");
  if (madinah) found.push(`Madinah hotel (${madinah})`);
  else if (raw.madinahHotel) missing.push(`Madinah hotel "${raw.madinahHotel}" — add it under Hotels or pick an existing one`);
  else missing.push("Madinah hotel");
  if (tiers.length) found.push(`prices (${tiers.join(", ")})`);
  else missing.push("room types + a price for each");
  if (raw.baggage) found.push("baggage");
  if (raw.seatsAvailable != null) found.push("seats");
  if (f && Object.keys(f).length) {
    found.push("flight details");
    warnings.push("Flight numbers/times are read from the page — confirm against the source.");
  }
  if (tiers.length) warnings.push("Prices are read from the page text — verify each amount before saving.");

  const summary: DraftSummary = {
    packageCode: raw.packageCode ?? null,
    groupCode: raw.groupCode ?? null,
    title,
    departureDate: raw.departureDate ?? null,
    airline: airline ?? raw.airline ?? null,
    cityCode: city?.code ?? raw.cityCode ?? null,
    durationDays: raw.durationDays ?? null,
    seatsTotal: raw.seatsTotal ?? raw.seatsAvailable ?? null,
    seatsAvailable: raw.seatsAvailable ?? null,
    prices: {
      sharing: priceObj.sharing ?? null,
      quad: priceObj.quad ?? null,
      triple: priceObj.triple ?? null,
      double: priceObj.double ?? null,
      infant: priceObj.infant ?? null,
      childNoBed: priceObj.childNoBed ?? null,
    },
    flightDepartureTime: f?.departureTime ?? null,
    flightArrivalTime: f?.arrivalTime ?? null,
    makkahHotel: makkah ?? raw.makkahHotel ?? null,
    madinahHotel: madinah ?? raw.madinahHotel ?? null,
  };

  return { json: JSON.stringify(json, null, 2), summary, found, missing, warnings };
}

// --- site adapters ---------------------------------------------------------

/** haramgatewayexpress.com — one departure card, each with several hotel "variants". */
function parseHaramGateway(html: string): RawPackage[] {
  const out: RawPackage[] = [];
  for (const card of splitByMarker(html, /class="flight-card-inner"/g)) {
    const groupCode = card.match(/SR\s+([A-Z]{2,3}-\d{3,8})/i)?.[1];
    const airline = (
      card.match(/class="air-logo"[^>]*\balt="([^"]+)"/i)?.[1] ??
      card.match(/airline-lockup[\s\S]{0,600}?<span>([^<]+)<\/span>/i)?.[1]
    )?.trim();
    const fromCode = card.match(/route-line[\s\S]{0,120}?<span>\s*([A-Z]{3})\s*<\/span>/i)?.[1];
    const departureDate = parseLooseDate(
      card.match(/bi-calendar-event[^>]*><\/i>\s*([0-9]{1,2}\s+[A-Za-z]{3,9}\s+[0-9]{4})/i)?.[1],
    );
    const durationDays = card.match(/([0-9]{1,2})\s*Days\b/i) ? Number(card.match(/([0-9]{1,2})\s*Days\b/i)![1]) : undefined;
    const seatsAvailable = card.match(/available-seat-chip[\s\S]{0,120}?<strong>\s*([0-9]{1,3})\s*<\/strong>/i)
      ? Number(card.match(/available-seat-chip[\s\S]{0,120}?<strong>\s*([0-9]{1,3})\s*<\/strong>/i)![1])
      : undefined;
    const baggage = normBaggage(card.match(/Baggage<\/span>\s*<strong>([^<]+)<\/strong>/i)?.[1]);
    const infant = money(card.match(/Infant<\/span>\s*<strong>([^<]+)<\/strong>/i)?.[1]);
    const childNoBed = money(card.match(/Child Without Bed<\/span>\s*<strong>([^<]+)<\/strong>/i)?.[1]);

    const sched = card.match(/schedule-box">([\s\S]*?)<\/div>/i)?.[1] ?? "";
    const legs = [
      ...sched.matchAll(/([A-Z]{2})\s?(\d{2,4})\s+\d{1,2}[A-Z]{3}\s+[A-Z]{3}-[A-Z]{3}\s+ETD\s+(\d{1,2}:\d{2})\s+ETA\s+(\d{1,2}:\d{2})/gi),
    ];
    const outboundNo = legs[0] ? `${legs[0][1]}-${legs[0][2]}` : undefined;
    const inboundNo = legs[1] ? `${legs[1][1]}-${legs[1][2]}` : undefined;
    const departureTime = legs[0] ? to24h(legs[0][3]) : undefined;
    const arrivalTime = legs[1] ? to24h(legs[1][4]) : undefined;
    const routeChip = card.match(/bi-signpost-2[^>]*><\/i>\s*([A-Z]{3}-[A-Z]{3}(?:-[A-Z]{3})?)/i)?.[1];
    const route = routeChip ? routeChip.replace(/-/g, " → ") : undefined;

    for (const v of splitByMarker(card, /class="variant-card"(?!-)/g)) {
      const packageCode = v.match(/variant-code">\s*([A-Z]{2,3}-\d{3,8})/i)?.[1];
      const hotelMatches = [
        ...v.matchAll(/data-hotel-name="([^"]*)"[\s\S]{0,200}?data-hotel-city="([^"]*)"/gi),
      ];
      const nightPills = [...v.matchAll(/night-pill">\s*(\d{1,2})\s*N/gi)].map((m) => Number(m[1]));
      let makkahHotel: string | undefined;
      let madinahHotel: string | undefined;
      let makkahNights: number | undefined;
      let madinahNights: number | undefined;
      hotelMatches.forEach((h, i) => {
        const nm = h[1].trim();
        const cty = h[2].trim().toLowerCase();
        if (cty.includes("makk") || cty.includes("mecca")) {
          makkahHotel = nm;
          makkahNights = nightPills[i] ?? makkahNights;
        } else if (cty.includes("madin") || cty.includes("medin")) {
          madinahHotel = nm;
          madinahNights = nightPills[i] ?? madinahNights;
        }
      });

      const prices: RawPrices = {};
      for (const pc of v.matchAll(/price-chip"><span>([^<]+)<\/span><strong>([^<]+)<\/strong>/gi)) {
        const label = pc[1].trim().toLowerCase();
        const val = money(pc[2]);
        if (val == null) continue;
        if (label.startsWith("shar")) prices.sharing = val;
        else if (label.startsWith("quad")) prices.quad = val;
        else if (label.startsWith("trip")) prices.triple = val;
        else if (label.startsWith("doub")) prices.double = val;
      }
      if (infant != null) prices.infant = infant;
      if (childNoBed != null) prices.childNoBed = childNoBed;

      // Skip stray variant markers that carried no real package data.
      if (!packageCode && Object.keys(prices).length === 0 && !makkahHotel) continue;

      out.push({
        title: `${durationDays ? durationDays + " Days " : ""}Umrah${fromCode ? " — " + fromCode : ""}`.trim(),
        cityCode: fromCode,
        airline,
        departureDate,
        durationDays,
        makkahHotel,
        madinahHotel,
        makkahNights,
        madinahNights,
        prices,
        baggage,
        seatsTotal: seatsAvailable,
        seatsAvailable,
        flight: { route, outboundNo, inboundNo, departureTime, arrivalTime, departureDate },
        packageCode,
        groupCode,
      });
      if (out.length >= MAX_DRAFTS) return out;
    }
  }
  return out;
}

/** fullumrahpackage.com — one anchor per package, most fields in data-* attributes. */
function parseFullUmrah(html: string): RawPackage[] {
  const out: RawPackage[] = [];
  for (const c of splitByMarker(html, /class="package-card package-item/g)) {
    const title = attr(c, "data-title").replace(/\s*\|\s*$/, "").trim() || undefined;
    const route = attr(c, "data-route") || undefined; // "LHE-JED"
    const cityCode = route ? route.split("-")[0] : undefined;
    const airline = attr(c, "data-airline") || undefined;
    const departureDate = parseLooseDate(attr(c, "data-date"));
    const nights = attr(c, "data-nights");
    const durationDays = nights ? Number(nights) : undefined;
    const makkahHotel = stripSimilar(attr(c, "data-makkah")) || undefined;
    const madinahHotel = stripSimilar(attr(c, "data-madinah")) || undefined;

    const fno = c.match(/fa-plane[^>]*><\/i>\s*([A-Z]{2})\s*-\s*(\d{2,4})/i);
    const outboundNo = fno ? `${fno[1]}-${fno[2]}` : undefined;
    const departureTime = to24h(c.match(/fa-clock[^>]*><\/i>\s*(\d{1,2}:\d{2}\s*[AP]M)/i)?.[1]);
    const baggage = normBaggage(c.match(/Baggage:\s*<strong>([^<]+)<\/strong>/i)?.[1]);

    const prices: RawPrices = {};
    for (const pr of c.matchAll(
      /umrah-price-row[^>]*>\s*<span[^>]*class="label"[^>]*>([^<]+)<\/span>\s*<span[^>]*class="value"[^>]*>\s*([\d,]+)/gi,
    )) {
      const label = pr[1].trim().toLowerCase();
      const val = money(pr[2]);
      if (val == null) continue;
      if (label.startsWith("shar")) prices.sharing = val;
      else if (label.startsWith("quad")) prices.quad = val;
      else if (label.startsWith("trip")) prices.triple = val;
      else if (label.startsWith("doub")) prices.double = val;
      else if (label.startsWith("infant")) prices.infant = val;
      else if (label.startsWith("child")) prices.childNoBed = val;
    }

    const codeM = title?.match(/PKG\s*(\d+)/i);
    const packageCode = codeM ? `PKG-${codeM[1]}` : undefined;

    if (!title && Object.keys(prices).length === 0) continue;

    out.push({
      title,
      cityCode,
      airline,
      departureDate,
      durationDays,
      makkahHotel,
      madinahHotel,
      prices,
      baggage,
      flight: { route: route ? route.replace("-", " → ") : undefined, outboundNo, departureTime, departureDate },
      packageCode,
    });
    if (out.length >= MAX_DRAFTS) return out;
  }
  return out;
}

/** Fallback: detect the repeating "card" container, then heuristically read each block. */
function parseGeneric(html: string, ctx: ImportContext): RawPackage[] {
  const counts = new Map<string, number>();
  for (const m of html.matchAll(/class="([^"]+)"/g)) {
    for (const tok of m[1].split(/\s+/)) {
      if (/(package|card|tour|deal|item|product|trip|listing)/i.test(tok)) {
        counts.set(tok, (counts.get(tok) ?? 0) + 1);
      }
    }
  }
  const candidates = [...counts.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]);
  for (const [tok] of candidates) {
    const blocks = splitByMarker(html, new RegExp(`class="[^"]*\\b${escapeRegExp(tok)}\\b[^"]*"`, "g"));
    const good = blocks.filter((b) => /\d{1,2}\s*(day|night)/i.test(b) && /\d[\d,]{3,}/.test(b));
    if (good.length >= 3) return good.slice(0, MAX_DRAFTS).map((b) => genericBlock(b, ctx));
  }
  return [genericBlock(html, ctx)];
}

/** Heuristic single-block extraction (known-record intersection + line scan). */
function genericBlock(block: string, ctx: ImportContext): RawPackage {
  const text = htmlToText(block);
  const lines = text.split("\n");
  const raw: RawPackage = {};

  const city = ctx.cities.find(
    (c) =>
      new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(c.name)}(?:[^a-z0-9]|$)`, "i").test(text) ||
      new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(c.code)}(?:[^a-z0-9]|$)`).test(text),
  );
  if (city) {
    raw.cityCode = city.code;
    raw.cityName = city.name;
  }
  raw.airline = longestHit(ctx.airlines, text) ?? undefined;
  raw.makkahHotel = longestHit(ctx.hotels.filter((h) => h.city === "Makkah").map((h) => h.name), text) ?? undefined;
  raw.madinahHotel = longestHit(ctx.hotels.filter((h) => h.city === "Madinah").map((h) => h.name), text) ?? undefined;

  const days = text.match(/\b(\d{1,2})\s*days?\b/i);
  const nights = text.match(/\b(\d{1,2})\s*nights?\b/i);
  raw.durationDays = days ? Number(days[1]) : nights ? Number(nights[1]) + 1 : undefined;
  raw.departureDate = parseLooseDate(text);
  raw.baggage = normBaggage(text.match(/\b(\d{2}\s*kgs?)\b/i)?.[1]);
  const code = text.match(/\b([A-Z]{2,3}-\d{4,8})\b/);
  if (code) raw.packageCode = code[1];

  const prices: RawPrices = {};
  for (const [k, rt] of TIER_MAP) {
    const p = priceOnLineWith(lines, rt);
    if (p != null) prices[k] = p;
  }
  const inf = priceOnLineWith(lines, "infant");
  const child = priceOnLineWith(lines, "child no bed") ?? priceOnLineWith(lines, "without bed");
  if (inf != null) prices.infant = inf;
  if (child != null) prices.childNoBed = child;
  raw.prices = prices;
  raw.title = (text.split("\n")[0] ?? "").slice(0, 160);
  return raw;
}

function longestHit(names: string[], text: string): string | null {
  let best: string | null = null;
  for (const name of names) {
    if (name.length < 3) continue;
    if (new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(name)}(?:[^a-z0-9]|$)`, "i").test(text) && (!best || name.length > best.length))
      best = name;
  }
  return best;
}

function priceOnLineWith(lines: string[], keyword: string): number | null {
  const kw = new RegExp(`\\b${escapeRegExp(keyword)}\\b`, "i");
  for (const line of lines) {
    if (!kw.test(line)) continue;
    const nums = [...line.matchAll(/(\d[\d,]{3,})/g)]
      .map((m) => Number(m[1].replace(/,/g, "")))
      .filter((n) => n >= 1000 && n <= 100_000_000);
    if (nums.length) return Math.max(...nums);
  }
  return null;
}

// --- public entry point ----------------------------------------------------

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export function extractPackageDrafts(html: string, url: string, ctx: ImportContext): ScrapeExtractResult {
  const host = hostnameOf(url);
  let site = host || "generic";
  let raws: RawPackage[];

  if (host.includes("haramgatewayexpress")) raws = parseHaramGateway(html);
  else if (host.includes("fullumrahpackage")) raws = parseFullUmrah(html);
  else {
    raws = parseGeneric(html, ctx);
    site = "generic";
  }

  // If a tuned adapter came back empty (markup changed), fall back to generic.
  if (raws.length === 0 && site !== "generic") {
    raws = parseGeneric(html, ctx);
    site = `${host} (generic fallback)`;
  }

  const totalOnPage = raws.length;
  const truncated = totalOnPage >= MAX_DRAFTS;
  const drafts = raws.slice(0, MAX_DRAFTS).map((r) => rawToDraft(r, ctx));
  return { site, drafts, truncated, totalOnPage };
}

// --- change detection ------------------------------------------------------

function eqAirline(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

function eqHotel(a: string | null, b: string | null): boolean {
  if (!a || !b) return false;
  const x = stripSimilar(a).toLowerCase();
  const y = stripSimilar(b).toLowerCase();
  return x === y || x.includes(y) || y.includes(x);
}

/** Match a scraped draft to an existing package: code first, then date+airline+city(+hotel). */
export function matchExisting(summary: DraftSummary, existing: ExistingLite[]): ExistingLite | null {
  const code = summary.packageCode?.toLowerCase();
  if (code) {
    const hit = existing.find((e) => e.packageCode && e.packageCode.toLowerCase() === code);
    if (hit) return hit;
  }
  if (summary.departureDate) {
    const hit = existing.find(
      (e) =>
        e.departureDate === summary.departureDate &&
        (!summary.airline || eqAirline(e.airline, summary.airline)) &&
        (!summary.cityCode || e.cityCode.toLowerCase() === summary.cityCode.toLowerCase()) &&
        (!summary.makkahHotel || eqHotel(e.makkahHotel, summary.makkahHotel)),
    );
    if (hit) return hit;
  }
  return null;
}

/** Field-level differences a scrape found vs the existing record (only where the scrape has a value). */
export function diffAgainst(summary: DraftSummary, e: ExistingLite): FieldChange[] {
  const changes: FieldChange[] = [];
  const num = (label: string, from: number | null, to: number | null) => {
    if (to != null && from !== to) changes.push({ label, from: from == null ? "—" : String(from), to: String(to) });
  };
  const str = (label: string, from: string | null, to: string | null) => {
    if (to && from !== to) changes.push({ label, from: from ?? "—", to });
  };

  num("Seats available", e.seatsAvailable, summary.seatsAvailable);
  num("Sharing price", e.prices.sharing, summary.prices.sharing);
  num("Quad price", e.prices.quad, summary.prices.quad);
  num("Triple price", e.prices.triple, summary.prices.triple);
  num("Double price", e.prices.double, summary.prices.double);
  num("Infant price", e.prices.infant, summary.prices.infant);
  num("Child (no bed) price", e.prices.childNoBed, summary.prices.childNoBed);
  num("Duration (days)", e.durationDays, summary.durationDays);
  str("Departure date", e.departureDate, summary.departureDate);
  str("Flight departure time", e.flightDepartureTime, summary.flightDepartureTime);
  str("Flight arrival time", e.flightArrivalTime, summary.flightArrivalTime);
  return changes;
}
