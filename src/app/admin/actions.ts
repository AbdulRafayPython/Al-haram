"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getBlockingFlightIssues } from "@/lib/flight";

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
  seatsTotal: number;
  seatsAvailable: number;
  packageCode: string | null;
  groupCode: string | null;
  flightRoute: string | null;
  flightOutboundNo: string | null;
  flightInboundNo: string | null;
  flightOutboundTime: string | null;
  flightInboundTime: string | null;
  flightDepartureTime: string | null;
  flightArrivalTime: string | null;
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
    price_pkr: fromPrice,
    seats_total: input.seatsTotal,
    seats_available: input.seatsAvailable,
    package_code: input.packageCode,
    group_code: input.groupCode,
    flight_route: input.flightRoute,
    flight_outbound_no: input.flightOutboundNo,
    flight_inbound_no: input.flightInboundNo,
    flight_outbound_time: input.flightOutboundTime,
    flight_inbound_time: input.flightInboundTime,
    flight_departure_time: input.flightDepartureTime,
    flight_arrival_time: input.flightArrivalTime,
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
    outboundTime: input.flightOutboundTime,
    inboundTime: input.flightInboundTime,
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

export async function createPackageAction(input: PackageFormInput) {
  assertPackageValid(input);
  const supabase = await createClient();
  const { error } = await supabase.from("packages").insert(toRow(input));
  if (error) throw new Error(error.message);
  revalidatePublicPages();
  redirect("/admin/packages");
}

export async function updatePackageAction(id: string, input: PackageFormInput) {
  assertPackageValid(input);
  const supabase = await createClient();
  const { error } = await supabase.from("packages").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublicPages();
  redirect("/admin/packages");
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
  return { name: clean };
}

/** Upload/replace a hotel's image (admin only; RLS enforces the role again). */
export async function uploadHotelImageAction(hotelId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) throw new Error("Choose an image to upload.");
  if (!file.type.startsWith("image/")) throw new Error("Only image files are allowed.");
  if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5 MB.");

  const supabase = await createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${hotelId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("hotel-images")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const { data: pub } = supabase.storage.from("hotel-images").getPublicUrl(path);
  const { error } = await supabase
    .from("hotels")
    .update({ image_url: pub.publicUrl, has_image: true })
    .eq("id", hotelId);
  if (error) throw new Error(error.message);

  revalidatePath("/saudi-hotels");
  revalidatePath("/admin/hotels");
}

/** Clear a hotel's image, falling back to the city placeholder on the public site. */
export async function removeHotelImageAction(hotelId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("hotels")
    .update({ image_url: null, has_image: false })
    .eq("id", hotelId);
  if (error) throw new Error(error.message);
  revalidatePath("/saudi-hotels");
  revalidatePath("/admin/hotels");
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
