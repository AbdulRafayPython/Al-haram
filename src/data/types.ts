/** Domain types shared across the data layer and UI. */

export type City = "Makkah" | "Madinah";

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
