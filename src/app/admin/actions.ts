"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesUpdate } from "@/lib/supabase/types";
import {
  packageInputToRow as toRow,
  assertPackageValid,
  type PackageFormInput,
} from "@/lib/packageRow";
import {
  parseAndValidatePackageJson,
  type ImportContext,
} from "@/lib/importPackage";
import {
  extractPackageDrafts,
  matchExisting,
  diffAgainst,
  type DraftSummary,
  type ExistingLite,
  type FieldChange,
} from "@/lib/scrapePackage";
import { fetchPage } from "@/lib/scrapeFetch";

/**
 * Verifies the current session belongs to an admin before any service-role
 * (RLS-bypassing) operation runs. See src/lib/supabase/admin.ts for why.
 */
async function assertAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const role = (data?.claims?.app_metadata as { role?: string } | undefined)?.role;
  if (role !== "admin") throw new Error("Not authorized.");
}

export interface LoginState {
  error?: string;
}

export async function loginAdmin(
  _prevState: LoginState | undefined,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    return { error: "Invalid email or password." };
  }

  const role = (data.user.app_metadata as { role?: string } | null)?.role;
  if (role !== "admin") {
    await supabase.auth.signOut();
    return { error: "This account does not have admin access." };
  }

  redirect("/admin");
}

export async function logoutAdmin() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/admin/packages");
  revalidatePath("/admin");
}

// Note: these deliberately do NOT call redirect() — they're awaited directly
// (not via a <form action>) from PackageWizard's client-side try/catch, and
// redirect() throws internally; catching that throw would show a fake error
// on an otherwise-successful save. The wizard navigates itself on success.
export async function createPackageAction(input: PackageFormInput) {
  assertPackageValid(input);
  const supabase = await createClient();
  const { error } = await supabase.from("packages").insert(toRow(input));
  if (error) throw new Error(error.message);
  revalidatePublicPages();
}

export async function updatePackageAction(id: string, input: PackageFormInput) {
  assertPackageValid(input);
  const supabase = await createClient();
  const { error } = await supabase.from("packages").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublicPages();
}

// --- Import a package from pasted JSON --------------------------------------

export interface ImportActionResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  preview?: {
    input: PackageFormInput;
    makkahHotelName: string;
    madinahHotelName: string;
  };
  created?: { id: string; title: string };
}

/** Load the real cities/airlines/hotels the pasted JSON is validated against. */
async function buildImportContext(): Promise<{
  ctx: ImportContext;
  hotelName: Map<string, string>;
}> {
  const supabase = await createClient();
  const [cities, airlines, hotels] = await Promise.all([
    supabase.from("cities").select("code, name").eq("is_active", true),
    supabase.from("airlines").select("name").eq("is_active", true),
    supabase.from("hotels").select("id, name, city"),
  ]);
  if (cities.error) throw new Error(cities.error.message);
  if (airlines.error) throw new Error(airlines.error.message);
  if (hotels.error) throw new Error(hotels.error.message);

  const hotelName = new Map((hotels.data ?? []).map((h) => [h.id, h.name]));
  return {
    ctx: {
      cities: cities.data ?? [],
      airlines: (airlines.data ?? []).map((a) => a.name),
      hotels: hotels.data ?? [],
    },
    hotelName,
  };
}

/** Validate pasted JSON and return a preview — does NOT write anything. */
export async function previewPackageImport(raw: string): Promise<ImportActionResult> {
  const { ctx, hotelName } = await buildImportContext();
  const result = parseAndValidatePackageJson(raw, ctx);
  if (!result.ok || !result.value) {
    return { ok: false, errors: result.errors, warnings: result.warnings };
  }
  return {
    ok: true,
    errors: [],
    warnings: result.warnings,
    preview: {
      input: result.value,
      makkahHotelName: hotelName.get(result.value.makkahHotelId ?? "") ?? "—",
      madinahHotelName: hotelName.get(result.value.madinahHotelId ?? "") ?? "—",
    },
  };
}

/**
 * Re-validate the pasted JSON server-side (never trust the client's preview)
 * and create the package on success.
 */
export async function importPackageAction(raw: string): Promise<ImportActionResult> {
  const { ctx } = await buildImportContext();
  const result = parseAndValidatePackageJson(raw, ctx);
  if (!result.ok || !result.value) {
    return { ok: false, errors: result.errors, warnings: result.warnings };
  }

  assertPackageValid(result.value);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("packages")
    .insert(toRow(result.value))
    .select("id, title")
    .single();
  if (error) throw new Error(error.message);
  revalidatePublicPages();
  return {
    ok: true,
    errors: [],
    warnings: result.warnings,
    created: { id: data.id, title: data.title },
  };
}

// --- Scrape ALL packages from a public listing URL --------------------------

/** One extracted package, classified against what's already in the DB. */
export interface ScrapeItem {
  /** Import-shape JSON for creating a NEW package (flows through importPackageAction). */
  json: string;
  /** Normalized values, sent back to apply changes to an existing match. */
  summary: DraftSummary;
  title: string;
  packageCode: string | null;
  status: "new" | "changed" | "unchanged";
  matchedId: string | null;
  matchedTitle: string | null;
  changes: FieldChange[];
  found: string[];
  missing: string[];
  warnings: string[];
}

export interface ScrapePackagesResult {
  ok: boolean;
  site?: string;
  sourceUrl?: string;
  totalOnPage?: number;
  truncated?: boolean;
  counts?: { new: number; changed: number; unchanged: number };
  items?: ScrapeItem[];
  error?: string;
}

/** Columns needed to match + diff a scraped package against existing records. */
const EXISTING_SELECT =
  "id, title, package_code, group_code, departure_date, airline, departure_city_code, duration_days, seats_total, seats_available, price_sharing, price_quad, price_triple, price_double, price_infant, price_child_no_bed, flight_departure_time, flight_arrival_time, makkah_hotel:hotels!packages_makkah_hotel_id_fkey(name), madinah_hotel:hotels!packages_madinah_hotel_id_fkey(name)";

interface ExistingRow {
  id: string;
  title: string;
  package_code: string | null;
  group_code: string | null;
  departure_date: string;
  airline: string;
  departure_city_code: string;
  duration_days: number;
  seats_total: number;
  seats_available: number;
  price_sharing: number | null;
  price_quad: number | null;
  price_triple: number | null;
  price_double: number | null;
  price_infant: number | null;
  price_child_no_bed: number | null;
  flight_departure_time: string | null;
  flight_arrival_time: string | null;
  makkah_hotel: { name: string } | null;
  madinah_hotel: { name: string } | null;
}

function rowToLite(row: ExistingRow): ExistingLite {
  return {
    id: row.id,
    title: row.title,
    packageCode: row.package_code ?? null,
    groupCode: row.group_code ?? null,
    departureDate: row.departure_date,
    airline: row.airline,
    cityCode: row.departure_city_code,
    durationDays: row.duration_days,
    seatsTotal: row.seats_total,
    seatsAvailable: row.seats_available,
    prices: {
      sharing: row.price_sharing ?? null,
      quad: row.price_quad ?? null,
      triple: row.price_triple ?? null,
      double: row.price_double ?? null,
      infant: row.price_infant ?? null,
      childNoBed: row.price_child_no_bed ?? null,
    },
    flightDepartureTime: row.flight_departure_time ?? null,
    flightArrivalTime: row.flight_arrival_time ?? null,
    makkahHotel: row.makkah_hotel?.name ?? null,
    madinahHotel: row.madinah_hotel?.name ?? null,
  };
}

/**
 * Fetch a public listing page and extract EVERY package on it. Each is
 * classified as new / changed / unchanged against the DB (matched by package
 * code, then departure date + airline + city + hotel). Nothing is written —
 * new packages flow through the same validate → create pipeline as the JSON
 * import; changes are applied via applyScrapedChangesAction.
 *
 * Admin-gated since it fetches an arbitrary external URL.
 */
export async function scrapePackagesAction(url: string): Promise<ScrapePackagesResult> {
  await assertAdmin();
  const clean = (url ?? "").trim();
  if (!clean) return { ok: false, error: "Paste a package page URL first." };

  try {
    const supabase = await createClient();
    const [{ html, finalUrl }, { ctx }, existingRes] = await Promise.all([
      fetchPage(clean),
      buildImportContext(),
      supabase.from("packages").select(EXISTING_SELECT),
    ]);
    if (existingRes.error) throw new Error(existingRes.error.message);
    const existing = (existingRes.data as unknown as ExistingRow[]).map(rowToLite);

    const { site, drafts, truncated, totalOnPage } = extractPackageDrafts(html, finalUrl, ctx);

    const counts = { new: 0, changed: 0, unchanged: 0 };
    const items: ScrapeItem[] = drafts.map((d) => {
      const match = matchExisting(d.summary, existing);
      let status: ScrapeItem["status"];
      let changes: FieldChange[] = [];
      if (!match) {
        status = "new";
        counts.new++;
      } else {
        changes = diffAgainst(d.summary, match);
        status = changes.length ? "changed" : "unchanged";
        counts[status]++;
      }
      return {
        json: d.json,
        summary: d.summary,
        title: d.summary.title || "(untitled package)",
        packageCode: d.summary.packageCode,
        status,
        matchedId: match?.id ?? null,
        matchedTitle: match?.title ?? null,
        changes,
        found: d.found,
        missing: d.missing,
        warnings: d.warnings,
      };
    });

    // Surface the actionable ones first: changed, then new, then unchanged.
    const order = { changed: 0, new: 1, unchanged: 2 } as const;
    items.sort((a, b) => order[a.status] - order[b.status]);

    return { ok: true, site, sourceUrl: finalUrl, totalOnPage, truncated, counts, items };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Could not scrape that URL." };
  }
}

const VALID_DATE = /^\d{4}-\d{2}-\d{2}$/;
const VALID_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Apply a scraped package's changed values onto an existing DB package. Only a
 * whitelisted set of columns (seats-available, prices, dates, duration, flight
 * times) is ever written, and the diff is recomputed server-side against the
 * live row — so this never rebuilds hotels/airline and can't be coerced into
 * mass-assignment. Returns the changes actually applied.
 */
export async function applyScrapedChangesAction(
  id: string,
  summary: DraftSummary,
): Promise<{ ok: boolean; updated?: FieldChange[]; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("packages").select(EXISTING_SELECT).eq("id", id).single();
  if (error || !data) return { ok: false, error: "That package no longer exists." };
  const existing = rowToLite(data as unknown as ExistingRow);

  const changes = diffAgainst(summary, existing);
  if (changes.length === 0) return { ok: true, updated: [] };

  const patch: Record<string, unknown> = {};

  const num = (v: number | null) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);
  if (num(summary.seatsAvailable) != null && summary.seatsAvailable !== existing.seatsAvailable) {
    patch.seats_available = Math.min(summary.seatsAvailable!, existing.seatsTotal);
  }
  const priceCols: [keyof DraftSummary["prices"], string][] = [
    ["sharing", "price_sharing"],
    ["quad", "price_quad"],
    ["triple", "price_triple"],
    ["double", "price_double"],
    ["infant", "price_infant"],
    ["childNoBed", "price_child_no_bed"],
  ];
  let priceChanged = false;
  for (const [k, col] of priceCols) {
    const v = num(summary.prices[k]);
    if (v != null && v !== existing.prices[k]) {
      patch[col] = v;
      priceChanged = true;
    }
  }
  if (summary.departureDate && VALID_DATE.test(summary.departureDate) && summary.departureDate !== existing.departureDate) {
    patch.departure_date = summary.departureDate;
  }
  if (
    summary.durationDays != null &&
    Number.isInteger(summary.durationDays) &&
    summary.durationDays > 0 &&
    summary.durationDays !== existing.durationDays
  ) {
    patch.duration_days = summary.durationDays;
  }
  if (
    summary.flightDepartureTime &&
    VALID_TIME.test(summary.flightDepartureTime) &&
    summary.flightDepartureTime !== existing.flightDepartureTime
  ) {
    patch.flight_departure_time = summary.flightDepartureTime;
  }
  if (
    summary.flightArrivalTime &&
    VALID_TIME.test(summary.flightArrivalTime) &&
    summary.flightArrivalTime !== existing.flightArrivalTime
  ) {
    patch.flight_arrival_time = summary.flightArrivalTime;
  }

  // Keep the "from" headline price (cheapest offered tier) consistent.
  if (priceChanged) {
    const fin = {
      sharing: (patch.price_sharing as number | undefined) ?? existing.prices.sharing,
      quad: (patch.price_quad as number | undefined) ?? existing.prices.quad,
      triple: (patch.price_triple as number | undefined) ?? existing.prices.triple,
      double: (patch.price_double as number | undefined) ?? existing.prices.double,
    };
    const offered = Object.values(fin).filter((v): v is number => typeof v === "number" && v > 0);
    if (offered.length) patch.price_pkr = Math.min(...offered);
  }

  if (Object.keys(patch).length === 0) return { ok: true, updated: [] };

  const { error: upErr } = await supabase
    .from("packages")
    .update(patch as TablesUpdate<"packages">)
    .eq("id", id);
  if (upErr) return { ok: false, error: upErr.message };
  revalidatePublicPages();
  return { ok: true, updated: changes };
}

/** Persist a newly typed airline so it's reusable in future packages. Returns the clean name. */
export async function createAirlineAction(name: string): Promise<{ name: string }> {
  const clean = name.trim();
  if (!clean) throw new Error("Airline name is required.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("airlines")
    .upsert({ name: clean, sort_order: 50 }, { onConflict: "name", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/airlines");
  return { name: clean };
}

/** Persist a newly typed departure city so it's reusable in future packages. */
export async function createCityAction(name: string, code: string): Promise<{ name: string; code: string }> {
  const cleanName = name.trim();
  const cleanCode = code.trim().toUpperCase();
  if (!cleanName || !cleanCode) throw new Error("City name and code are required.");
  if (cleanCode.length > 4) throw new Error("City code must be at most 4 characters.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("cities")
    .upsert({ name: cleanName, code: cleanCode, sort_order: 50 }, { onConflict: "code", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cities");
  revalidatePath("/");
  return { name: cleanName, code: cleanCode };
}

export interface CityFormInput {
  name: string;
  code: string;
}

export async function updateCityAction(id: string, input: CityFormInput) {
  const cleanName = input.name.trim();
  const cleanCode = input.code.trim().toUpperCase();
  if (!cleanName || !cleanCode) throw new Error("City name and code are required.");
  if (cleanCode.length > 4) throw new Error("City code must be at most 4 characters.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("cities")
    .update({ name: cleanName, code: cleanCode })
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      throw new Error("That city code is already used by another city.");
    }
    throw new Error(error.message);
  }
  revalidatePath("/admin/cities");
  revalidatePath("/");
}

/** Deleting a city only removes it from the picker — packages store the city as free text, not a reference. */
export async function deleteCityAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cities").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/cities");
  revalidatePath("/");
}

/** Upload/replace an airline's logo. Converted to WebP before storage so every logo is compact and consistent. */
export async function uploadAirlineLogoAction(airlineId: string, formData: FormData) {
  await assertAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose a logo image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  const webpBuffer = await sharp(inputBuffer)
    .resize(256, 256, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 90 })
    .toBuffer();

  const admin = createAdminClient();
  const path = `${airlineId}/${Date.now()}.webp`;

  const { error: uploadError } = await admin.storage
    .from("airline-logos")
    .upload(path, webpBuffer, { upsert: true, contentType: "image/webp" });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = admin.storage.from("airline-logos").getPublicUrl(path);
  const { error } = await admin
    .from("airlines")
    .update({ logo_url: pub.publicUrl })
    .eq("id", airlineId);
  if (error) throw new Error(error.message);

  revalidatePath("/");
  revalidatePath("/admin/airlines");
}

/** Clear an airline's logo; the card falls back to an initials badge. */
export async function removeAirlineLogoAction(airlineId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from("airlines").update({ logo_url: null }).eq("id", airlineId);
  if (error) throw new Error(error.message);
  revalidatePath("/");
  revalidatePath("/admin/airlines");
}

/** Upload/replace a hotel's image (admin verified explicitly, then a service-role client performs the write). */
export async function uploadHotelImageAction(hotelId: string, formData: FormData) {
  await assertAdmin();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");

  const admin = createAdminClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${hotelId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await admin.storage
    .from("hotel-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = admin.storage.from("hotel-images").getPublicUrl(path);
  const { error } = await admin
    .from("hotels")
    .update({ image_url: pub.publicUrl, has_image: true })
    .eq("id", hotelId);
  if (error) throw new Error(error.message);

  revalidatePath("/saudi-hotels");
  revalidatePath("/admin/hotels");
}

/** Clear a hotel's image, falling back to the city placeholder on the public site. */
export async function removeHotelImageAction(hotelId: string) {
  await assertAdmin();
  const admin = createAdminClient();
  const { error } = await admin
    .from("hotels")
    .update({ image_url: null, has_image: false })
    .eq("id", hotelId);
  if (error) throw new Error(error.message);
  revalidatePath("/saudi-hotels");
  revalidatePath("/admin/hotels");
}

export interface HotelFormInput {
  name: string;
  city: "Makkah" | "Madinah";
  location: string;
  distance: string;
  rateSharing: number | null;
  rateDouble: number;
  rateTriple: number;
  rateQuad: number;
}

function toHotelRow(input: HotelFormInput) {
  return {
    name: input.name.trim(),
    city: input.city,
    location: input.location.trim(),
    distance: input.distance.trim(),
    rate_sharing: input.rateSharing,
    rate_double: input.rateDouble,
    rate_triple: input.rateTriple,
    rate_quad: input.rateQuad,
  };
}

function assertHotelValid(input: HotelFormInput) {
  if (!input.name.trim()) throw new Error("Hotel name is required.");
  if (!input.location.trim()) throw new Error("Location is required.");
  if (!input.distance.trim()) throw new Error("Distance / shuttle info is required.");
  if (input.rateDouble <= 0 || input.rateTriple <= 0 || input.rateQuad <= 0) {
    throw new Error("Double, triple, and quad rates must be greater than zero.");
  }
}

function revalidateHotelPages() {
  revalidatePath("/saudi-hotels");
  revalidatePath("/admin/hotels");
}

export async function createHotelAction(input: HotelFormInput) {
  assertHotelValid(input);
  const supabase = await createClient();
  const { error } = await supabase.from("hotels").insert(toHotelRow(input));
  if (error) throw new Error(error.message);
  revalidateHotelPages();
}

export async function updateHotelAction(id: string, input: HotelFormInput) {
  assertHotelValid(input);
  const supabase = await createClient();
  const { error } = await supabase.from("hotels").update(toHotelRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidateHotelPages();
}

/** Blocked with a friendly message if the hotel is still referenced by a package. */
export async function deleteHotelAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hotels").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("This hotel is used by one or more packages. Reassign or delete those packages first.");
    }
    throw new Error(error.message);
  }
  revalidateHotelPages();
}

export async function deletePackageAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("packages").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublicPages();
}

export async function togglePublishAction(id: string, isPublished: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("packages")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublicPages();
}
