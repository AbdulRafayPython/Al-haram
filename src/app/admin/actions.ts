"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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
  roomType: string;
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
    room_type: input.roomType,
    price_sharing: input.priceSharing,
    price_quad: input.priceQuad,
    price_triple: input.priceTriple,
    price_double: input.priceDouble,
    price_infant: input.priceInfant,
    price_pkr: input.priceSharing,
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

function revalidatePublicPages() {
  revalidatePath("/");
  revalidatePath("/admin/packages");
  revalidatePath("/admin");
}

export async function createPackageAction(input: PackageFormInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("packages").insert(toRow(input));
  if (error) throw new Error(error.message);
  revalidatePublicPages();
  redirect("/admin/packages");
}

export async function updatePackageAction(id: string, input: PackageFormInput) {
  const supabase = await createClient();
  const { error } = await supabase.from("packages").update(toRow(input)).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePublicPages();
  redirect("/admin/packages");
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
