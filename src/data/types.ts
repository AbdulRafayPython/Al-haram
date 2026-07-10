/** Domain types shared across the data layer and UI. */

export type City = "Makkah" | "Madinah";

/** Round-trip flight legs shown on the package card. */
export interface FlightItinerary {
  route: string; // "MUX → JED"
  outboundNo: string; // "SV-801"
  inboundNo: string; // "SV-800"
  outboundTime: string; // scheduled outbound clock time, e.g. "4:45 PM"
  inboundTime: string; // scheduled return clock time, e.g. "3:05 PM"
  departureTime: string; // leaves Pakistan, e.g. "7:30 PM"
  arrivalTime: string; // lands back, e.g. "8:30 AM"
}

/** Per-person price by room occupancy (PKR). */
export interface PriceTiers {
  sharing: number;
  quad: number;
  triple: number;
  double: number;
  infant: number;
}

export interface UmrahPackage {
  id: string;
  title: string;
  airline: string;
  departureCity: string; // e.g. "Karachi (KHI)"
  departureCityCode: string; // e.g. "KHI"
  durationDays: number;
  departureDate: string; // ISO date
  makkahHotel: string;
  madinahHotel: string;
  roomType: "Sharing" | "Quad" | "Triple" | "Double";
  pricePkr: number;
  seatsTotal: number;
  seatsAvailable: number;
  featured?: boolean;

  // --- Enriched detail (populated in data/packages.ts) ------------------
  returnDate?: string; // ISO — departureDate + durationDays
  makkahNights?: number;
  madinahNights?: number;
  makkahLocation?: string;
  madinahLocation?: string;
  packageCode?: string; // "UP-100317"
  groupCode?: string; // "UG-100311"
  flight?: FlightItinerary;
  pricing?: PriceTiers;
}

export interface Hotel {
  id: string;
  name: string;
  city: City;
  location: string;
  distance: string; // "450-500 MTR" or "Shuttle Service"
  rates: {
    sharing?: number;
    double: number;
    triple: number;
    quad: number;
  };
  hasImage: boolean;
}

export interface TransportRate {
  id: string;
  from: string;
  to: string;
  category: "Airport" | "Hotel" | "Railway" | "Ziyarat";
  prices: Partial<Record<VehicleKey, number>>;
}

export type VehicleKey = "car" | "staria" | "gmc" | "hiace" | "coaster";

export interface Vehicle {
  key: VehicleKey;
  name: string;
  capacity: string;
  icon: string; // Material Symbols name
}

export interface Visa {
  id: string;
  type: "Umrah" | "Hajj" | "Tour" | "Arrival";
  title: string;
  country: string;
  mode: string;
  validityDays: number;
  processingDays: number;
  pricePkr: number;
  note?: string;
}

export interface Testimonial {
  name: string;
  date: string;
  rating: number;
  quote: string;
}
