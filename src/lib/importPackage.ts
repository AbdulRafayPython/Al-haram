/**
 * Import-a-package-from-JSON: shared schema, sample, and strict validator.
 *
 * The admin copies the sample below, has ChatGPT reshape their own package data
 * into it, pastes the result back, and the system extracts + validates it into a
 * real package. This module is the single source of truth for both the preview
 * and the commit path (see importPackageAction / previewPackageImport in
 * app/admin/actions.ts), so the two can never drift.
 *
 * Security: only known fields are ever read (a strict whitelist — unknown keys
 * are ignored, never forwarded to the database), every value is type/range
 * checked, and cities/airlines/hotels are resolved against the real records the
 * server passes in. The server always re-validates before inserting; the client
 * only uses this for a friendly preview.
 */
import { ROOM_TYPES, type RoomType } from "@/data/types";
import { getBlockingFlightIssues, getFlightIssues, toTimeInputValue } from "@/lib/flight";
import type { PackageFormInput } from "@/lib/packageRow";

/** Real records the validator resolves names/codes against (loaded server-side). */
export interface ImportContext {
  cities: { code: string; name: string }[];
  airlines: string[];
  hotels: { id: string; name: string; city: string }[];
}

export interface ImportValidationResult {
  ok: boolean;
  /** Blocking problems — the package cannot be created until these are fixed. */
  errors: string[];
  /** Non-blocking notes — worth checking, but creation is allowed. */
  warnings: string[];
  /** The mapped, ready-to-insert form input (only when ok === true). */
  value?: PackageFormInput;
}

/** The copy-paste sample. Kept as a string so "Copy sample" is exact. */
export const PACKAGE_JSON_SAMPLE = `{
  "title": "Premium Umrah — Karachi",
  "departureCity": "Karachi",
  "departureCityCode": "KHI",
  "airline": "Saudi Arabian Airlines",
  "departureDate": "2026-08-22",
  "durationDays": 20,
  "makkahHotel": "Hilton Suites Makkah",
  "madinahHotel": "Anwar Al Madinah Movenpick",
  "makkahNights": 11,
  "madinahNights": 9,
  "roomTypes": ["Quad", "Triple", "Double"],
  "prices": {
    "quad": 285000,
    "triple": 320000,
    "double": 360000,
    "infant": 75000,
    "childNoBed": 120000
  },
  "baggage": "30KG",
  "seatsTotal": 40,
  "seatsAvailable": 40,
  "flight": {
    "route": "KHI → JED → KHI",
    "outboundNo": "SV-761",
    "inboundNo": "SV-762",
    "departureTime": "19:20",
    "arrivalTime": "00:20",
    "departureDate": "2026-08-22",
    "arrivalDate": "2026-09-12"
  },
  "packageCode": "BM-101480",
  "groupCode": "BM-101480",
  "featured": false
}`;

/** A short field guide shown next to the sample. */
export const PACKAGE_JSON_FIELD_NOTES: { field: string; note: string }[] = [
  { field: "title *", note: "Package title shown in the admin list." },
  { field: "departureCity / departureCityCode *", note: "Must match an existing city (name or code)." },
  { field: "airline *", note: "Must match an existing airline name exactly (case-insensitive)." },
  { field: "departureDate *", note: "YYYY-MM-DD." },
  { field: "durationDays *", note: "Whole number of days (also the package 'class', e.g. 20 Days Package)." },
  { field: "makkahHotel / madinahHotel *", note: "Must match existing hotels in the right city." },
  { field: "makkahNights / madinahNights", note: "Optional; should add up to durationDays." },
  { field: "roomTypes *", note: "Any of Sharing, Quad, Triple, Double." },
  { field: "prices *", note: "A price (> 0) for every room type offered; infant & childNoBed optional." },
  { field: "baggage", note: 'Optional free text, e.g. "30KG".' },
  { field: "seatsTotal / seatsAvailable", note: "Optional; available cannot exceed total. Defaults to 40/40." },
  { field: "flight", note: "Optional; times in 24-hour HH:MM." },
  { field: "packageCode / groupCode / featured", note: "Optional." },
];

// --- coercion helpers -------------------------------------------------------

function toNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[,\s]/g, "");
    if (cleaned === "") return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toIsoDate(v: unknown): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  const trimmed = v.trim();
  // Fast path: already YYYY-MM-DD.
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const d = new Date(`${trimmed}T00:00:00Z`);
    return Number.isNaN(d.getTime()) ? null : trimmed;
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

const KNOWN_KEYS = new Set([
  "title", "departureCity", "departureCityCode", "airline", "departureDate",
  "durationDays", "makkahHotel", "madinahHotel", "makkahNights", "madinahNights",
  "roomTypes", "prices", "baggage", "seatsTotal", "seatsAvailable", "flight",
  "packageCode", "groupCode", "featured",
]);

const KNOWN_FLIGHT_KEYS = new Set([
  "route", "outboundNo", "inboundNo", "departureTime", "arrivalTime",
  "departureDate", "arrivalDate",
]);

const PRICE_KEY: Record<RoomType, "sharing" | "quad" | "triple" | "double"> = {
  Sharing: "sharing",
  Quad: "quad",
  Triple: "triple",
  Double: "double",
};

/** Normalize a user-supplied room-type token to its canonical RoomType, if valid. */
function canonicalRoomType(v: unknown): RoomType | null {
  if (typeof v !== "string") return null;
  const match = ROOM_TYPES.find((r) => r.toLowerCase() === v.trim().toLowerCase());
  return match ?? null;
}

/**
 * Parse + validate a pasted package JSON against the real cities/airlines/hotels.
 * Collects *all* problems (not just the first) so the admin can fix everything
 * in one pass.
 */
export function parseAndValidatePackageJson(
  raw: string,
  ctx: ImportContext,
): ImportValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!raw || !raw.trim()) {
    return { ok: false, errors: ["Paste the package JSON first."], warnings };
  }

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    return {
      ok: false,
      errors: [`Invalid JSON — ${e instanceof Error ? e.message : "could not parse"}.`],
      warnings,
    };
  }

  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return { ok: false, errors: ["The JSON must be a single object { ... }."], warnings };
  }

  const obj = data as Record<string, unknown>;

  // Flag (but ignore) unknown top-level keys so typos surface to the admin.
  for (const key of Object.keys(obj)) {
    if (!KNOWN_KEYS.has(key)) warnings.push(`Ignoring unknown field "${key}".`);
  }

  // --- title ---
  const title = typeof obj.title === "string" ? obj.title.trim() : "";
  if (!title) errors.push('"title" is required.');
  else if (title.length > 160) errors.push('"title" must be 160 characters or fewer.');

  // --- city (by code or name) ---
  const cityCodeRaw = typeof obj.departureCityCode === "string" ? obj.departureCityCode.trim() : "";
  const cityNameRaw = typeof obj.departureCity === "string" ? obj.departureCity.trim() : "";
  let city: { code: string; name: string } | undefined;
  if (cityCodeRaw) {
    city = ctx.cities.find((c) => c.code.toLowerCase() === cityCodeRaw.toLowerCase());
  }
  if (!city && cityNameRaw) {
    // Accept "Karachi" or "Karachi (KHI)".
    const nameOnly = cityNameRaw.replace(/\s*\([^)]*\)\s*$/, "").trim();
    city = ctx.cities.find((c) => c.name.toLowerCase() === nameOnly.toLowerCase());
  }
  if (!city) {
    if (!cityCodeRaw && !cityNameRaw) {
      errors.push('"departureCity" (or "departureCityCode") is required.');
    } else {
      errors.push(
        `Unknown departure city "${cityCodeRaw || cityNameRaw}". Add it under Cities first, or use one of: ${
          ctx.cities.map((c) => `${c.name} (${c.code})`).join(", ") || "— no cities defined —"
        }.`,
      );
    }
  }

  // --- airline ---
  const airlineRaw = typeof obj.airline === "string" ? obj.airline.trim() : "";
  let airline: string | undefined;
  if (airlineRaw) {
    airline = ctx.airlines.find((a) => a.toLowerCase() === airlineRaw.toLowerCase());
  }
  if (!airline) {
    if (!airlineRaw) errors.push('"airline" is required.');
    else
      errors.push(
        `Unknown airline "${airlineRaw}". Add it under Airlines first, or use one of: ${
          ctx.airlines.join(", ") || "— no airlines defined —"
        }.`,
      );
  }

  // --- dates + duration ---
  const departureDate = toIsoDate(obj.departureDate);
  if (!departureDate) {
    errors.push(
      obj.departureDate == null
        ? '"departureDate" is required (YYYY-MM-DD).'
        : `"departureDate" is not a valid date: "${String(obj.departureDate)}".`,
    );
  }

  const durationDays = toNumber(obj.durationDays);
  if (durationDays == null || !Number.isInteger(durationDays) || durationDays <= 0) {
    errors.push('"durationDays" must be a whole number greater than 0.');
  }

  // --- hotels ---
  const makkahName = typeof obj.makkahHotel === "string" ? obj.makkahHotel.trim() : "";
  const madinahName = typeof obj.madinahHotel === "string" ? obj.madinahHotel.trim() : "";
  const resolveHotel = (name: string, wantCity: "Makkah" | "Madinah", field: string) => {
    if (!name) {
      errors.push(`"${field}" is required.`);
      return undefined;
    }
    const inCity = ctx.hotels.filter((h) => h.city === wantCity);
    const hit = inCity.find((h) => h.name.toLowerCase() === name.toLowerCase());
    if (!hit) {
      // Is it a real hotel but in the wrong city?
      const wrongCity = ctx.hotels.find((h) => h.name.toLowerCase() === name.toLowerCase());
      if (wrongCity) {
        errors.push(`"${field}" — "${name}" is a ${wrongCity.city} hotel, not ${wantCity}.`);
      } else {
        errors.push(
          `"${field}" — no ${wantCity} hotel named "${name}". Add it under Hotels first, or use one of: ${
            inCity.map((h) => h.name).join(", ") || `— no ${wantCity} hotels defined —`
          }.`,
        );
      }
      return undefined;
    }
    return hit;
  };
  const makkahHotel = resolveHotel(makkahName, "Makkah", "makkahHotel");
  const madinahHotel = resolveHotel(madinahName, "Madinah", "madinahHotel");

  // --- nights (optional) ---
  const durOk = durationDays != null && Number.isInteger(durationDays) && durationDays > 0;
  let makkahNights = toNumber(obj.makkahNights);
  let madinahNights = toNumber(obj.madinahNights);
  const nightsProvided = makkahNights != null || madinahNights != null;
  if (makkahNights != null && (!Number.isInteger(makkahNights) || makkahNights < 0)) {
    errors.push('"makkahNights" must be a whole number of 0 or more.');
  }
  if (madinahNights != null && (!Number.isInteger(madinahNights) || madinahNights < 0)) {
    errors.push('"madinahNights" must be a whole number of 0 or more.');
  }
  if (!nightsProvided && durOk) {
    makkahNights = Math.round(durationDays! * 0.6);
    madinahNights = durationDays! - makkahNights;
    warnings.push(
      `Nights not provided — defaulted to ${makkahNights} in Makkah and ${madinahNights} in Madinah. Verify before publishing.`,
    );
  } else {
    makkahNights = makkahNights ?? 0;
    madinahNights = madinahNights ?? 0;
    if (durOk && makkahNights + madinahNights !== durationDays) {
      warnings.push(
        `Nights add up to ${makkahNights + madinahNights}, but durationDays is ${durationDays}. Double-check.`,
      );
    }
  }

  // --- room types + prices ---
  let roomTypes: RoomType[] = [];
  if (!Array.isArray(obj.roomTypes) || obj.roomTypes.length === 0) {
    errors.push('"roomTypes" must be a non-empty list (any of Sharing, Quad, Triple, Double).');
  } else {
    const seen = new Set<RoomType>();
    for (const r of obj.roomTypes) {
      const canon = canonicalRoomType(r);
      if (!canon) errors.push(`Unknown room type "${String(r)}". Use Sharing, Quad, Triple, or Double.`);
      else seen.add(canon);
    }
    roomTypes = ROOM_TYPES.filter((r) => seen.has(r));
  }

  const pricesObj =
    typeof obj.prices === "object" && obj.prices !== null && !Array.isArray(obj.prices)
      ? (obj.prices as Record<string, unknown>)
      : null;
  if (!pricesObj) {
    errors.push('"prices" must be an object mapping each offered room type to a price.');
  }

  const priceFor = (rt: RoomType): number | null => {
    if (!pricesObj) return null;
    const n = toNumber(pricesObj[PRICE_KEY[rt]]);
    return n;
  };
  for (const rt of roomTypes) {
    const p = priceFor(rt);
    if (p == null || p <= 0) {
      errors.push(`Price for "${rt}" is required and must be greater than 0 (prices.${PRICE_KEY[rt]}).`);
    }
  }

  let priceInfant: number | null = null;
  let priceChildNoBed: number | null = null;
  if (pricesObj) {
    if (pricesObj.infant != null) {
      const n = toNumber(pricesObj.infant);
      if (n == null || n < 0) errors.push('"prices.infant" must be 0 or more.');
      else priceInfant = n;
    }
    if (pricesObj.childNoBed != null) {
      const n = toNumber(pricesObj.childNoBed);
      if (n == null || n < 0) errors.push('"prices.childNoBed" must be 0 or more.');
      else priceChildNoBed = n;
    }
  }

  // --- seats (optional, default 40/40) ---
  let seatsTotal = obj.seatsTotal == null ? 40 : toNumber(obj.seatsTotal);
  let seatsAvailable = obj.seatsAvailable == null ? null : toNumber(obj.seatsAvailable);
  if (seatsTotal == null || !Number.isInteger(seatsTotal) || seatsTotal < 0) {
    errors.push('"seatsTotal" must be a whole number of 0 or more.');
    seatsTotal = 40;
  }
  if (seatsAvailable == null) {
    seatsAvailable = seatsTotal;
  } else if (!Number.isInteger(seatsAvailable) || seatsAvailable < 0) {
    errors.push('"seatsAvailable" must be a whole number of 0 or more.');
    seatsAvailable = seatsTotal;
  } else if (seatsAvailable > seatsTotal) {
    errors.push(`"seatsAvailable" (${seatsAvailable}) cannot exceed "seatsTotal" (${seatsTotal}).`);
  }

  // --- baggage (optional) ---
  let baggage: string | null = null;
  if (obj.baggage != null) {
    if (typeof obj.baggage !== "string") errors.push('"baggage" must be text, e.g. "30KG".');
    else {
      const b = obj.baggage.trim();
      if (b.length > 40) errors.push('"baggage" must be 40 characters or fewer.');
      else baggage = b || null;
    }
  }

  // --- flight (optional) ---
  let flightRoute: string | null = null;
  let flightOutboundNo: string | null = null;
  let flightInboundNo: string | null = null;
  let flightDepartureTime: string | null = null;
  let flightArrivalTime: string | null = null;
  let flightDepartureDate: string | null = null;
  let flightArrivalDate: string | null = null;
  if (obj.flight != null) {
    if (typeof obj.flight !== "object" || Array.isArray(obj.flight)) {
      errors.push('"flight" must be an object (or omit it).');
    } else {
      const f = obj.flight as Record<string, unknown>;
      for (const key of Object.keys(f)) {
        if (!KNOWN_FLIGHT_KEYS.has(key)) warnings.push(`Ignoring unknown flight field "${key}".`);
      }
      const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
      flightRoute = str(f.route);
      flightOutboundNo = str(f.outboundNo);
      flightInboundNo = str(f.inboundNo);
      flightDepartureDate = f.departureDate == null ? null : toIsoDate(f.departureDate);
      flightArrivalDate = f.arrivalDate == null ? null : toIsoDate(f.arrivalDate);
      if (f.departureDate != null && !flightDepartureDate)
        errors.push(`"flight.departureDate" is not a valid date: "${String(f.departureDate)}".`);
      if (f.arrivalDate != null && !flightArrivalDate)
        errors.push(`"flight.arrivalDate" is not a valid date: "${String(f.arrivalDate)}".`);
      // Times: accept "HH:MM" (24h) or legacy "h:mm AM/PM"; store as HH:MM.
      if (f.departureTime != null) {
        const t = toTimeInputValue(f.departureTime as string);
        if (!t) errors.push(`"flight.departureTime" is not a valid time: "${String(f.departureTime)}".`);
        else flightDepartureTime = t;
      }
      if (f.arrivalTime != null) {
        const t = toTimeInputValue(f.arrivalTime as string);
        if (!t) errors.push(`"flight.arrivalTime" is not a valid time: "${String(f.arrivalTime)}".`);
        else flightArrivalTime = t;
      }
      // Mirror the wizard's flight rules.
      const flightIssues = getFlightIssues({
        outboundNo: flightOutboundNo,
        inboundNo: flightInboundNo,
        departureTime: flightDepartureTime,
        arrivalTime: flightArrivalTime,
      });
      for (const issue of getBlockingFlightIssues({
        outboundNo: flightOutboundNo,
        inboundNo: flightInboundNo,
        departureTime: flightDepartureTime,
        arrivalTime: flightArrivalTime,
      })) {
        errors.push(issue.message);
      }
      for (const issue of flightIssues.filter((i) => i.kind === "override")) {
        warnings.push(issue.message);
      }
    }
  }

  // --- optional strings / flags ---
  const packageCode =
    typeof obj.packageCode === "string" && obj.packageCode.trim() ? obj.packageCode.trim() : null;
  const groupCode =
    typeof obj.groupCode === "string" && obj.groupCode.trim() ? obj.groupCode.trim() : null;
  let featured = false;
  if (obj.featured != null) {
    if (typeof obj.featured !== "boolean") warnings.push('"featured" should be true or false — treating as false.');
    else featured = obj.featured;
  }

  if (errors.length > 0) return { ok: false, errors, warnings };

  // Safe to assert the resolved values now — all required checks passed.
  const value: PackageFormInput = {
    title,
    airline: airline!,
    departureCity: `${city!.name} (${city!.code})`,
    departureCityCode: city!.code,
    durationDays: durationDays!,
    departureDate: departureDate!,
    makkahHotelId: makkahHotel!.id,
    madinahHotelId: madinahHotel!.id,
    makkahNights: makkahNights!,
    madinahNights: madinahNights!,
    roomTypes,
    priceSharing: roomTypes.includes("Sharing") ? priceFor("Sharing")! : 0,
    priceQuad: roomTypes.includes("Quad") ? priceFor("Quad") : null,
    priceTriple: roomTypes.includes("Triple") ? priceFor("Triple") : null,
    priceDouble: roomTypes.includes("Double") ? priceFor("Double") : null,
    priceInfant,
    priceChildNoBed,
    seatsTotal: seatsTotal!,
    seatsAvailable: seatsAvailable!,
    packageCode,
    groupCode,
    flightRoute,
    flightOutboundNo,
    flightInboundNo,
    flightDepartureTime,
    flightArrivalTime,
    flightDepartureDate,
    flightArrivalDate,
    baggage,
    featured,
  };

  return { ok: true, errors, warnings, value };
}
