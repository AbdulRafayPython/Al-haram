"use server";

import { createBooking, type BookingResult, type CreateBookingInput } from "@/lib/data/bookings";

export async function createBookingAction(input: CreateBookingInput): Promise<BookingResult> {
  if (!input.packageId) throw new Error("Missing package.");
  // Name and phone are mandatory (mirrored by the DB insert policy).
  if (!input.name?.trim()) throw new Error("Your name is required.");
  if (!input.phone?.trim()) throw new Error("A phone number is required.");
  if (input.adults <= 0) throw new Error("At least one adult is required.");
  if (input.adults + input.infants + input.childNoBed <= 0) {
    throw new Error("Add at least one traveller.");
  }
  if (!input.roomType) throw new Error("Choose a room type.");
  return createBooking(input);
}
