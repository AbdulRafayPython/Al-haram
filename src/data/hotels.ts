import type { Hotel } from "./types";

/**
 * Representative Makkah & Madinah hotel inventory (rates in SAR).
 * Mirrors the structure of the live directory; swap for a Supabase query later.
 */
export const hotels: Hotel[] = [
  // ---- Makkah ----
  {
    id: "mk-al-kiswah",
    name: "Al Kiswah Towers",
    city: "Makkah",
    location: "Al Taysir Street",
    distance: "Shuttle Service",
    rates: { double: 130, triple: 130, quad: 130 },
    hasImage: true,
  },
  {
    id: "mk-areej-al-zahbi",
    name: "Areej Al Zahbi",
    city: "Makkah",
    location: "Al Hijrah Road",
    distance: "450-500 MTR",
    rates: { sharing: 48, double: 210, triple: 210, quad: 210 },
    hasImage: true,
  },
  {
    id: "mk-fakhir-al-azizia",
    name: "Fakhir Al Azizia",
    city: "Makkah",
    location: "Azizia Makkah",
    distance: "Shuttle Service",
    rates: { sharing: 15, double: 75, triple: 75, quad: 75 },
    hasImage: false,
  },
  {
    id: "mk-rawabi-al-zahra",
    name: "Rawabi Al Zahra",
    city: "Makkah",
    location: "Ibrahim Al Khalil Road",
    distance: "300-350 MTR",
    rates: { sharing: 70, double: 320, triple: 300, quad: 280 },
    hasImage: true,
  },
  {
    id: "mk-dar-al-eiman",
    name: "Dar Al Eiman Grand",
    city: "Makkah",
    location: "Facing Haram",
    distance: "0-50 MTR",
    rates: { sharing: 150, double: 650, triple: 600, quad: 560 },
    hasImage: true,
  },
  {
    id: "mk-anjum",
    name: "Anjum Makkah",
    city: "Makkah",
    location: "Jabal Omar",
    distance: "150-200 MTR",
    rates: { sharing: 110, double: 480, triple: 450, quad: 420 },
    hasImage: true,
  },
  // ---- Madinah ----
  {
    id: "md-bir-al-eiman",
    name: "Bir Al Eiman",
    city: "Madinah",
    location: "South Markazia",
    distance: "200-250 MTR",
    rates: { sharing: 60, double: 290, triple: 290, quad: 290 },
    hasImage: true,
  },
  {
    id: "md-manazil-marjan",
    name: "Manazil Marjan",
    city: "Madinah",
    location: "Qurban Nazil Road",
    distance: "Shuttle Service",
    rates: { sharing: 27, double: 120, triple: 120, quad: 120 },
    hasImage: false,
  },
  {
    id: "md-frontel-al-harithia",
    name: "Frontel Al Harithia",
    city: "Madinah",
    location: "Central Area",
    distance: "100-150 MTR",
    rates: { sharing: 90, double: 410, triple: 380, quad: 360 },
    hasImage: true,
  },
  {
    id: "md-taiba-front",
    name: "Taiba Front Hotel",
    city: "Madinah",
    location: "Facing Masjid an-Nabawi",
    distance: "0-50 MTR",
    rates: { sharing: 130, double: 560, triple: 520, quad: 480 },
    hasImage: true,
  },
  {
    id: "md-al-eiman-royal",
    name: "Al Eiman Royal",
    city: "Madinah",
    location: "King Fahd Road",
    distance: "250-300 MTR",
    rates: { sharing: 55, double: 250, triple: 240, quad: 230 },
    hasImage: false,
  },
];

export const hotelStats = {
  total: 60,
  makkah: 33,
  madinah: 27,
  withImages: 26,
};
