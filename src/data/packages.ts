import type { UmrahPackage, Testimonial } from "./types";

export const departureCities = [
  { code: "KHI", name: "Karachi" },
  { code: "ISB", name: "Islamabad" },
  { code: "LHE", name: "Lahore" },
  { code: "MUX", name: "Multan" },
  { code: "PEW", name: "Peshawar" },
];

export const airlines = [
  "Saudia",
  "PIA",
  "Fly Jinnah",
  "Airblue",
  "Emirates",
  "FlyDubai",
  "Air Arabia",
  "SalamAir",
];

// --- Enrichment -------------------------------------------------------------
// The board data is seeded with the essentials; the richer detail every card
// shows (flight legs, hotel nights split + location, booking codes, per-room
// pricing) is derived here so it stays consistent and in one place.

/** IATA-style flight-number prefix per carrier. */
const FLIGHT_CODES: Record<string, string> = {
  Saudia: "SV",
  PIA: "PK",
  "Fly Jinnah": "9P",
  Airblue: "PA",
  Emirates: "EK",
  FlyDubai: "FZ",
  "Air Arabia": "G9",
  SalamAir: "OV",
};

const MAKKAH_LOCATIONS: Record<string, string> = {
  "Fakhir Al Azizia": "Al Aziziyah · Shuttle to Haram",
  "Anjum Makkah": "Umm Al Qura Rd · 200 m to Haram",
  "Dar Al Eiman Grand": "King Abdul Aziz Endowment · Facing Haram",
  "Areej Al Zahbi": "Ajyad St · 550 m to Haram",
  "Al Kiswah Towers": "Jabal Al Kaaba · 400 m to Haram",
  "Rawabi Al Zahra": "Al Ghazza St · 900 m · Shuttle",
};

const MADINAH_LOCATIONS: Record<string, string> = {
  "Manazil Marjan": "Markaziyah Janoubiyah · 300 m to Masjid Nabawi",
  "Frontel Al Harithia": "Central Zone · 250 m to Masjid Nabawi",
  "Taiba Front Hotel": "King Fahd Rd · Facing Masjid Nabawi",
  "Bir Al Eiman": "Al Haram Area · 350 m to Masjid Nabawi",
  "Al Eiman Royal": "Central Zone · 200 m to Masjid Nabawi",
};

const OUTBOUND_TIMES = ["4:45 PM", "2:10 AM", "11:20 PM", "9:05 AM", "6:30 PM"];
const INBOUND_TIMES = ["3:05 PM", "1:40 AM", "10:15 PM", "8:25 AM", "5:50 PM"];
const DEPARTURE_TIMES = ["7:30 PM", "5:15 AM", "1:55 AM", "11:40 AM", "9:10 PM"];
const ARRIVAL_TIMES = ["8:30 AM", "6:45 AM", "3:20 AM", "1:05 PM", "10:35 AM"];

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Fill in the presentational detail every package card renders. */
function enrich(base: UmrahPackage, i: number): UmrahPackage {
  const nights = base.durationDays;
  const makkahNights = Math.round(nights * 0.6);
  const madinahNights = nights - makkahNights;

  const prefix = FLIGHT_CODES[base.airline] ?? "XX";
  const flightNo = 800 + (i % 5) * 2; // stable per-package, avoids clashes
  const slot = i % OUTBOUND_TIMES.length;

  // Last two digits of the package id → booking codes (UP-1003xx / UG-1003xx).
  const serial = base.id.slice(-2);

  const sharing = base.pricePkr;
  const pricing = {
    sharing,
    quad: sharing + 6300,
    triple: sharing + 21400,
    double: sharing + 51600,
    infant: 75000,
  };

  return {
    ...base,
    returnDate: addDays(base.departureDate, nights),
    makkahNights,
    madinahNights,
    makkahLocation:
      MAKKAH_LOCATIONS[base.makkahHotel] ?? "Central Makkah · Shuttle to Haram",
    madinahLocation:
      MADINAH_LOCATIONS[base.madinahHotel] ?? "Central Madinah · Near Masjid Nabawi",
    packageCode: `UP-1003${serial}`,
    groupCode: `UG-1003${serial}`,
    flight: {
      route: `${base.departureCityCode} → JED`,
      outboundNo: `${prefix}-${flightNo + 1}`,
      inboundNo: `${prefix}-${flightNo}`,
      outboundTime: OUTBOUND_TIMES[slot],
      inboundTime: INBOUND_TIMES[slot],
      departureTime: DEPARTURE_TIMES[slot],
      arrivalTime: ARRIVAL_TIMES[slot],
    },
    pricing,
  };
}

const rawPackages: UmrahPackage[] = [
  {
    id: "pkg-khi-001",
    title: "Economy Umrah — Karachi",
    airline: "Fly Jinnah",
    departureCity: "Karachi (KHI)",
    departureCityCode: "KHI",
    durationDays: 14,
    departureDate: "2026-07-12",
    makkahHotel: "Fakhir Al Azizia",
    madinahHotel: "Manazil Marjan",
    roomType: "Quad",
    pricePkr: 185000,
    seatsTotal: 40,
    seatsAvailable: 12,
  },
  {
    id: "pkg-lhe-002",
    title: "Premium Umrah — Lahore",
    airline: "Saudia",
    departureCity: "Lahore (LHE)",
    departureCityCode: "LHE",
    durationDays: 21,
    departureDate: "2026-07-20",
    makkahHotel: "Anjum Makkah",
    madinahHotel: "Frontel Al Harithia",
    roomType: "Triple",
    pricePkr: 365000,
    seatsTotal: 50,
    seatsAvailable: 28,
    featured: true,
  },
  {
    id: "pkg-isb-003",
    title: "Deluxe Haram View — Islamabad",
    airline: "Emirates",
    departureCity: "Islamabad (ISB)",
    departureCityCode: "ISB",
    durationDays: 28,
    departureDate: "2026-08-02",
    makkahHotel: "Dar Al Eiman Grand",
    madinahHotel: "Taiba Front Hotel",
    roomType: "Double",
    pricePkr: 590000,
    seatsTotal: 30,
    seatsAvailable: 6,
    featured: true,
  },
  {
    id: "pkg-khi-004",
    title: "Standard Umrah — Karachi",
    airline: "Airblue",
    departureCity: "Karachi (KHI)",
    departureCityCode: "KHI",
    durationDays: 21,
    departureDate: "2026-08-10",
    makkahHotel: "Areej Al Zahbi",
    madinahHotel: "Bir Al Eiman",
    roomType: "Quad",
    pricePkr: 275000,
    seatsTotal: 45,
    seatsAvailable: 31,
  },
  {
    id: "pkg-lhe-005",
    title: "Economy Umrah — Lahore",
    airline: "Air Arabia",
    departureCity: "Lahore (LHE)",
    departureCityCode: "LHE",
    durationDays: 14,
    departureDate: "2026-08-18",
    makkahHotel: "Al Kiswah Towers",
    madinahHotel: "Al Eiman Royal",
    roomType: "Quad",
    pricePkr: 198000,
    seatsTotal: 60,
    seatsAvailable: 0,
  },
  {
    id: "pkg-mux-006",
    title: "Family Umrah — Multan",
    airline: "PIA",
    departureCity: "Multan (MUX)",
    departureCityCode: "MUX",
    durationDays: 21,
    departureDate: "2026-09-01",
    makkahHotel: "Rawabi Al Zahra",
    madinahHotel: "Frontel Al Harithia",
    roomType: "Triple",
    pricePkr: 342000,
    seatsTotal: 35,
    seatsAvailable: 9,
  },
  {
    id: "pkg-isb-007",
    title: "Economy Umrah — Islamabad",
    airline: "SalamAir",
    departureCity: "Islamabad (ISB)",
    departureCityCode: "ISB",
    durationDays: 14,
    departureDate: "2026-09-05",
    makkahHotel: "Fakhir Al Azizia",
    madinahHotel: "Manazil Marjan",
    roomType: "Quad",
    pricePkr: 189000,
    seatsTotal: 48,
    seatsAvailable: 22,
  },
  {
    id: "pkg-pew-008",
    title: "Standard Umrah — Peshawar",
    airline: "FlyDubai",
    departureCity: "Peshawar (PEW)",
    departureCityCode: "PEW",
    durationDays: 21,
    departureDate: "2026-09-14",
    makkahHotel: "Anjum Makkah",
    madinahHotel: "Bir Al Eiman",
    roomType: "Triple",
    pricePkr: 318000,
    seatsTotal: 30,
    seatsAvailable: 15,
  },
  {
    id: "pkg-lhe-009",
    title: "Deluxe Umrah — Lahore",
    airline: "Saudia",
    departureCity: "Lahore (LHE)",
    departureCityCode: "LHE",
    durationDays: 28,
    departureDate: "2026-09-22",
    makkahHotel: "Dar Al Eiman Grand",
    madinahHotel: "Taiba Front Hotel",
    roomType: "Double",
    pricePkr: 575000,
    seatsTotal: 40,
    seatsAvailable: 18,
    featured: true,
  },
  {
    id: "pkg-khi-010",
    title: "Premium Umrah — Karachi",
    airline: "Emirates",
    departureCity: "Karachi (KHI)",
    departureCityCode: "KHI",
    durationDays: 28,
    departureDate: "2026-10-03",
    makkahHotel: "Rawabi Al Zahra",
    madinahHotel: "Frontel Al Harithia",
    roomType: "Triple",
    pricePkr: 412000,
    seatsTotal: 36,
    seatsAvailable: 27,
  },
];

export const packages: UmrahPackage[] = rawPackages.map(enrich);

/** Services bundled into every Umrah package. */
export const includedServices = [
  "Accommodation",
  "Transport",
  "Visa",
  "Return Ticket",
  "Premium Support",
] as const;

export const packageStats = {
  departures: 205,
  seatsAvailable: 5104,
  soldOut: 970,
  variants: 459,
};

export const cityBreakdown = [
  { city: "Karachi (KHI)", total: 827, sold: 200, available: 627 },
  { city: "Islamabad (ISB)", total: 932, sold: 188, available: 744 },
  { city: "Lahore (LHE)", total: 2970, sold: 262, available: 2708 },
  { city: "Multan (MUX)", total: 240, sold: 161, available: 79 },
  { city: "Peshawar (PEW)", total: 110, sold: 0, available: 110 },
];

export const testimonials: Testimonial[] = [
  {
    name: "Ayesha Noor",
    date: "Sep 2025",
    rating: 5,
    quote:
      "The package details were crystal clear from the start — no hidden surprises. Everything matched exactly what we were promised.",
  },
  {
    name: "Muhammad Bilal",
    date: "Oct 2025",
    rating: 5,
    quote:
      "Incredibly responsive staff. They kept us updated at every step and answered every question patiently on WhatsApp.",
  },
  {
    name: "Ahmed Raza",
    date: "Oct 2025",
    rating: 5,
    quote:
      "What stood out was the transparency and honest dealings. I felt my trust was respected throughout the journey.",
  },
  {
    name: "Saima Khalid",
    date: "Nov 2025",
    rating: 5,
    quote:
      "Visa and tickets were issued on time. A minor transport delay was handled professionally and resolved quickly.",
  },
  {
    name: "Abdul Rehman",
    date: "Nov 2025",
    rating: 5,
    quote:
      "Professional service and clear process from enquiry to departure. I would recommend them to my family without hesitation.",
  },
  {
    name: "Hina Shahid",
    date: "Dec 2025",
    rating: 5,
    quote:
      "As a first-time Umrah traveler, the guidance I received made the entire experience calm and stress-free.",
  },
];
