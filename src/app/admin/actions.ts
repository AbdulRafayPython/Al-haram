"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBlockingFlightIssues } from "@/lib/flight";

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

export interface PackageFormInput {
  title: string;
  airline: string;
  departureCity: string;
  departureCityCode: string;
  durationDays: number;
  departureDate: string;
  makkahHotelId: string | null;
  madinahHotelId: string | null;
  makkahNights: number;
  madinahNights: number;
  roomTypes: string[];
  priceSharing: number;
  priceQuad: number | null;
  priceTriple: number | null;
  priceDouble: number | null;
  priceInfant: number | null;
  priceChildNoBed: number | null;
  seatsTotal: number;
  seatsAvailable: number;
  packageCode: string | null;
  groupCode: string | null;
  flightRoute: string | null;
  flightOutboundNo: string | null;
  flightInboundNo: string | null;
  flightDepartureTime: string | null;
  flightArrivalTime: string | null;
  flightDepartureDate: string | null;
  flightArrivalDate: string | null;
  featured: boolean;
}

function toRow(input: PackageFormInput) {
  // Only persist prices for the room types this package actually offers.
  const offered = new Set(input.roomTypes);
  const priceSharing = offered.has("Sharing") ? input.priceSharing : null;
  const priceQuad = offered.has("Quad") ? input.priceQuad : null;
  const priceTriple = offered.has("Triple") ? input.priceTriple : null;
  const priceDouble = offered.has("Double") ? input.priceDouble : null;

  // "From" price = cheapest offered tier (used for sort/numbering + card headline).
  const offeredPrices = [priceSharing, priceQuad, priceTriple, priceDouble].filter(
    (p): p is number => p != null && p > 0,
  );
  const fromPrice = offeredPrices.length ? Math.min(...offeredPrices) : input.priceSharing;

  return {
    title: input.title,
    airline: input.airline,
    departure_city: input.departureCity,
    departure_city_code: input.departureCityCode,
    duration_days: input.durationDays,
    departure_date: input.departureDate,
    makkah_hotel_id: input.makkahHotelId,
    madinah_hotel_id: input.madinahHotelId,
    makkah_nights: input.makkahNights,
    madinah_nights: input.madinahNights,
    room_types: input.roomTypes,
    room_type: input.roomTypes[0] ?? null, // legacy single column
    price_sharing: priceSharing,
    price_quad: priceQuad,
    price_triple: priceTriple,
    price_double: priceDouble,
    price_infant: input.priceInfant,
    price_child_no_bed: input.priceChildNoBed,
    price_pkr: fromPrice,
    seats_total: input.seatsTotal,
    seats_available: input.seatsAvailable,
    package_code: input.packageCode,
    group_code: input.groupCode,
    flight_route: input.flightRoute,
    flight_outbound_no: input.flightOutboundNo,
    flight_inbound_no: input.flightInboundNo,
    flight_departure_time: input.flightDepartureTime,
    flight_arrival_time: input.flightArrivalTime,
    flight_departure_date: input.flightDepartureDate,
    flight_arrival_date: input.flightArrivalDate,
    featured: input.featured,
  };
}

/** Server-side safety net mirroring the wizard's blocking flight rules. */
function assertPackageValid(input: PackageFormInput) {
  if (input.roomTypes.length === 0) {
    throw new Error("Select at least one room type.");
  }
  const blocking = getBlockingFlightIssues({
    outboundNo: input.flightOutboundNo,
    inboundNo: input.flightInboundNo,
    departureTime: input.flightDepartureTime,
    arrivalTime: input.flightArrivalTime,
  });
  if (blocking.length > 0) {
    throw new Error(blocking[0].message);
  }
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
