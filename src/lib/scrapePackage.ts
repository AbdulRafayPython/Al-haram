/**
 * Scrape-a-package: deterministic (rule-based) extraction of a package draft
 * from a fetched web page.
 *
 * This is a *best-effort* extractor, not magic. Umrah sites all differ, so the
 * only fields we can fill with confidence are the ones that intersect the real
 * records the admin already has (airlines, cities, Makkah/Madinah hotels) — a
 * known hotel/airline name literally appearing in the page maps straight to a
 * DB row. Everything else (title, duration, prices, dates, flight numbers) is a
 * heuristic guess flagged for review.
 *
 * The output is a draft in the exact same shape as PACKAGE_JSON_SAMPLE, dropped
 * into the same textarea the manual JSON import uses — so it flows through the
 * identical validate → preview → create pipeline and the admin fixes anything
 * wrong before a single row is written. No field here is ever trusted for a
 * write; parseAndValidatePackageJson re-checks all of it server-side.
 *
 * Pure module (no I/O) so it can be unit-tested with the repo's Node type-strip
 * loader. The network fetch lives separately in lib/scrapeFetch.ts.
 */
import { ROOM_TYPES, type RoomType } from "@/data/types";
import type { ImportContext } from "@/lib/importPackage";

export interface ScrapeDraft {
  /** Pretty-printed JSON in PACKAGE_JSON_SAMPLE shape, ready for the editor. */
  json: string;
  /** Human-readable labels of fields we managed to fill. */
  found: string[];
  /** Required fields still blank — the admin must complete these. */
  missing: string[];
  /** Low-confidence guesses worth double-checking. */
  warnings: string[];
}

const PRICE_KEY: Record<RoomType, "sharing" | "quad" | "triple" | "double"> = {
  Sharing: "sharing",
  Quad: "quad",
  Triple: "triple",
  Double: "double",
};

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// --- HTML → text -----------------------------------------------------------

function decodeEntities(s: string): string {
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => safeCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => safeCodePoint(parseInt(d, 10)));
}

function safeCodePoint(n: number): string {
  try {
    return Number.isFinite(n) && n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : "";
  } catch {
    return "";
  }
}

/** Strip a full HTML document down to visible, line-broken text. */
export function htmlToText(html: string): string {
  const withoutHidden = html
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, " ");
  const lineBroken = withoutHidden
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|header|footer|table|ul|ol)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");
  const text = decodeEntities(lineBroken.replace(/<[^>]+>/g, " "));
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t\f\v ]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .slice(0, 200_000);
}

// --- meta / title ----------------------------------------------------------

function metaContent(html: string, key: string): string | null {
  // matches property="og:title" or name="description", content in either order
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${key}["']`, "i"),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return decodeEntities(m[1]).trim();
  }
  return null;
}

function pageTitle(html: string): string | null {
  const og = metaContent(html, "og:title");
  if (og) return og;
  const t = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
  if (t) return decodeEntities(t).replace(/\s+/g, " ").trim();
  const h1 = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1];
  if (h1) return decodeEntities(h1.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
  return null;
}

// --- JSON-LD structured data ----------------------------------------------

/** Collect every JSON-LD object on the page (flattening @graph and arrays). */
function jsonLdObjects(html: string): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  const blocks = html.matchAll(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );
  for (const b of blocks) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(b[1].trim());
    } catch {
      continue;
    }
    const stack = [parsed];
    while (stack.length) {
      const node = stack.pop();
      if (Array.isArray(node)) stack.push(...node);
      else if (node && typeof node === "object") {
        const obj = node as Record<string, unknown>;
        out.push(obj);
        if (Array.isArray(obj["@graph"])) stack.push(...(obj["@graph"] as unknown[]));
      }
    }
  }
  return out;
}

/** Pull an offer price out of any JSON-LD offers shape. */
function jsonLdPrice(objs: Record<string, unknown>[]): number | null {
  for (const o of objs) {
    const offers = o.offers ?? o.priceSpecification;
    const candidates = Array.isArray(offers) ? offers : offers ? [offers] : [];
    for (const c of candidates) {
      if (c && typeof c === "object") {
        const p = (c as Record<string, unknown>).price ?? (c as Record<string, unknown>).lowPrice;
        const n = toNumber(p);
        if (n != null && n > 0) return n;
      }
    }
  }
  return null;
}

// --- coercion helpers ------------------------------------------------------

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,\s]/g, "");
    if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Longest known name (case-insensitive) that appears as a whole word in text. */
function longestNameHit(names: string[], text: string): string | null {
  let best: string | null = null;
  for (const name of names) {
    if (name.length < 3) continue;
    const re = new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(name)}(?:[^a-z0-9]|$)`, "i");
    if (re.test(text) && (!best || name.length > best.length)) best = name;
  }
  return best;
}

/** Parse loose month-name / ISO dates → { iso, index } (numeric-only dates are too ambiguous to trust). */
function findDates(text: string): { iso: string; index: number }[] {
  const found: { iso: string; index: number }[] = [];
  const push = (y: number, mo: number, d: number, index: number) => {
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return;
    const iso = `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!Number.isNaN(new Date(`${iso}T00:00:00Z`).getTime())) found.push({ iso, index });
  };
  // ISO: 2026-08-22
  for (const m of text.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    push(Number(m[1]), Number(m[2]), Number(m[3]), m.index ?? 0);
  }
  // "22 August 2026" / "22 Aug, 2026"
  for (const m of text.matchAll(/\b(\d{1,2})\s+([a-z]{3,9})\.?,?\s+(\d{4})\b/gi)) {
    const mo = MONTHS[m[2].slice(0, 3).toLowerCase()];
    if (mo) push(Number(m[3]), mo, Number(m[1]), m.index ?? 0);
  }
  // "August 22, 2026" / "Aug 22 2026"
  for (const m of text.matchAll(/\b([a-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})\b/gi)) {
    const mo = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mo) push(Number(m[3]), mo, Number(m[2]), m.index ?? 0);
  }
  return found.sort((a, b) => a.index - b.index);
}

/** Largest price-shaped number (≥4 digits) on any line mentioning `keyword`. */
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

// --- main extractor --------------------------------------------------------

export function extractPackageDraft(html: string, url: string, ctx: ImportContext): ScrapeDraft {
  const text = htmlToText(html);
  const lines = text.split("\n");
  const ld = jsonLdObjects(html);
  const found: string[] = [];
  const warnings: string[] = [];

  // Ordered to mirror PACKAGE_JSON_SAMPLE; only fields we fill are emitted.
  const draft: Record<string, unknown> = {};

  // title — JSON-LD name, then og:title / <title>
  const ldName = ld.map((o) => o.name ?? o.headline).find((v) => typeof v === "string") as string | undefined;
  const title = (ldName ?? pageTitle(html) ?? "").replace(/\s+/g, " ").trim().slice(0, 160);
  draft.title = title;
  if (title) found.push("title");

  // departure city (name or code) — known-record intersection
  const cityByName = ctx.cities.find((c) => longestNameHit([c.name], text) != null);
  const cityByCode = ctx.cities.find((c) =>
    new RegExp(`(?:^|[^a-z0-9])${escapeRegExp(c.code)}(?:[^a-z0-9]|$)`).test(text),
  );
  const city = cityByName ?? cityByCode;
  draft.departureCity = city?.name ?? "";
  draft.departureCityCode = city?.code ?? "";
  if (city) found.push(`departure city (${city.name})`);

  // airline — known-record intersection
  const airline = longestNameHit(ctx.airlines, text);
  draft.airline = airline ?? "";
  if (airline) found.push(`airline (${airline})`);

  // departure date — prefer a date near a "depart" mention, else the first date
  const dates = findDates(text);
  let departureDate = "";
  if (dates.length) {
    const departIdx = text.search(/depart/i);
    const near = departIdx >= 0 ? dates.find((d) => d.index >= departIdx) : undefined;
    departureDate = (near ?? dates[0]).iso;
    draft.departureDate = departureDate;
    found.push("departure date");
    warnings.push(`Departure date read as ${departureDate} — confirm it's the right one.`);
  } else {
    draft.departureDate = "";
  }

  // duration (days) — else derive from nights
  const daysHit = text.match(/\b(\d{1,2})\s*days?\b/i);
  const nightsHit = text.match(/\b(\d{1,2})\s*nights?\b/i);
  let durationDays: number | null = daysHit ? Number(daysHit[1]) : null;
  if (durationDays == null && nightsHit) {
    durationDays = Number(nightsHit[1]) + 1;
    warnings.push(`Duration derived from "${nightsHit[1]} nights" as ${durationDays} days — verify.`);
  }
  if (durationDays != null && durationDays > 0 && durationDays <= 60) {
    draft.durationDays = durationDays;
    found.push(`duration (${durationDays} days)`);
  } else {
    draft.durationDays = null;
  }

  // hotels — a known hotel name literally present in the page maps to a real row
  const makkahHotels = ctx.hotels.filter((h) => h.city === "Makkah").map((h) => h.name);
  const madinahHotels = ctx.hotels.filter((h) => h.city === "Madinah").map((h) => h.name);
  const makkahHotel = longestNameHit(makkahHotels, text);
  const madinahHotel = longestNameHit(madinahHotels, text);
  draft.makkahHotel = makkahHotel ?? "";
  draft.madinahHotel = madinahHotel ?? "";
  if (makkahHotel) found.push(`Makkah hotel (${makkahHotel})`);
  if (madinahHotel) found.push(`Madinah hotel (${madinahHotel})`);

  // nights per city
  const makkahN = text.match(/makkah[^\n\d]{0,25}?(\d{1,2})\s*nights?|(\d{1,2})\s*nights?[^\n\d]{0,15}?makkah/i);
  const madinahN = text.match(/mad(?:i|ee)nah[^\n\d]{0,25}?(\d{1,2})\s*nights?|(\d{1,2})\s*nights?[^\n\d]{0,15}?mad(?:i|ee)nah/i);
  const mkNights = makkahN ? Number(makkahN[1] ?? makkahN[2]) : null;
  const mdNights = madinahN ? Number(madinahN[1] ?? madinahN[2]) : null;
  if (mkNights != null && mkNights >= 0 && mkNights <= 40) draft.makkahNights = mkNights;
  if (mdNights != null && mdNights >= 0 && mdNights <= 40) draft.madinahNights = mdNights;
  if (mkNights != null || mdNights != null) found.push("nights");

  // room types present on the page (word-boundary token match)
  const roomTypes = ROOM_TYPES.filter((rt) => new RegExp(`\\b${rt}\\b`, "i").test(text));
  draft.roomTypes = roomTypes;

  // prices — JSON-LD offer as a floor, then per-room-type line scan
  const prices: Record<string, number> = {};
  const ldFloor = jsonLdPrice(ld);
  for (const rt of roomTypes) {
    const p = priceOnLineWith(lines, rt);
    if (p != null) prices[PRICE_KEY[rt]] = p;
  }
  if (Object.keys(prices).length === 0 && ldFloor != null && roomTypes.length) {
    // Nothing matched per-tier, but the page advertised a headline price.
    prices[PRICE_KEY[roomTypes[0]]] = ldFloor;
  }
  const infantP = priceOnLineWith(lines, "infant");
  const childP =
    priceOnLineWith(lines, "child no bed") ??
    priceOnLineWith(lines, "without bed") ??
    priceOnLineWith(lines, "child");
  if (infantP != null) prices.infant = infantP;
  if (childP != null) prices.childNoBed = childP;
  draft.prices = prices;
  if (roomTypes.length) {
    found.push(`room types (${roomTypes.join(", ")})`);
    warnings.push("Room types and prices are guessed from the page text — verify each amount.");
  }

  // baggage
  const bag = text.match(/\b(\d{2})\s*kgs?\b/i);
  if (bag) {
    draft.baggage = `${bag[1]}KG`;
    found.push("baggage");
  }

  // seats
  const seatsTotal = text.match(/\b(\d{1,3})\s*seats?\b/i);
  const seatsAvail = text.match(/\b(\d{1,3})\s*seats?\s*(?:are\s*)?(?:available|left|remaining)\b/i);
  if (seatsTotal) {
    draft.seatsTotal = Number(seatsTotal[1]);
    found.push("seats");
  }
  if (seatsAvail) draft.seatsAvailable = Number(seatsAvail[1]);

  // flight numbers / route (best effort)
  const flight: Record<string, string> = {};
  const flightNos = [...text.matchAll(/\b([A-Z]{2})[\s-]?(\d{2,4})\b/g)]
    .map((m) => `${m[1]}-${m[2]}`)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 2);
  if (flightNos[0]) flight.outboundNo = flightNos[0];
  if (flightNos[1]) flight.inboundNo = flightNos[1];
  const route = text.match(/\b([A-Z]{3})\s*(?:→|-|to|→)\s*([A-Z]{3})\b/);
  if (route) flight.route = `${route[1]} → ${route[2]}`;
  if (Object.keys(flight).length) {
    draft.flight = flight;
    found.push("flight details");
    warnings.push("Flight numbers/route are guessed — confirm against the source.");
  }

  // package / group code
  const code = text.match(/\b([A-Z]{2,3}-\d{4,8})\b/);
  if (code) {
    draft.packageCode = code[1];
    draft.groupCode = code[1];
    found.push("package code");
  }

  draft.featured = false;

  // What's still required but blank?
  const missing: string[] = [];
  if (!draft.title) missing.push("title");
  if (!draft.departureCity) missing.push("departure city (must match one of your cities)");
  if (!draft.airline) missing.push("airline (must match one of your airlines)");
  if (!draft.departureDate) missing.push("departure date");
  if (draft.durationDays == null) missing.push("duration (days)");
  if (!draft.makkahHotel) missing.push("Makkah hotel (must match one of your hotels)");
  if (!draft.madinahHotel) missing.push("Madinah hotel (must match one of your hotels)");
  if (!Array.isArray(draft.roomTypes) || (draft.roomTypes as unknown[]).length === 0)
    missing.push("room types + a price for each");
  else if (Object.keys(prices).length < roomTypes.length)
    missing.push("a price for every room type");

  return { json: JSON.stringify(draft, null, 2), found, missing, warnings };
}
