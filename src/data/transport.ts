import type { TransportRate, Vehicle } from "./types";

export const vehicles: Vehicle[] = [
  { key: "car", name: "Car", capacity: "3 passengers", icon: "directions_car" },
  { key: "staria", name: "Staria / Star Ex", capacity: "7 passengers", icon: "airport_shuttle" },
  { key: "gmc", name: "GMC", capacity: "7 passengers", icon: "directions_car" },
  { key: "hiace", name: "Hiace", capacity: "9-10 passengers", icon: "airport_shuttle" },
  { key: "coaster", name: "Coaster", capacity: "On request", icon: "directions_bus" },
];

/** Transport rates in SAR. Empty cells mean "quote on request". */
export const transportRates: TransportRate[] = [
  {
    id: "t-jed-mak",
    from: "Jeddah Airport",
    to: "Makkah Hotel",
    category: "Airport",
    prices: { car: 160, staria: 320, gmc: 420, hiace: 480, coaster: 580 },
  },
  {
    id: "t-mak-mad",
    from: "Makkah Hotel",
    to: "Madinah Hotel",
    category: "Hotel",
    prices: { car: 375, staria: 600, gmc: 720, hiace: 800, coaster: 890 },
  },
  {
    id: "t-mak-rail",
    from: "Makkah Hotel",
    to: "Haramain Railway",
    category: "Railway",
    prices: { car: 115, staria: 200, gmc: 250, hiace: 300, coaster: 340 },
  },
  {
    id: "t-mad-rail",
    from: "Madinah Hotel",
    to: "Haramain Railway",
    category: "Railway",
    prices: { car: 120, staria: 210, gmc: 260, hiace: 310, coaster: 350 },
  },
  {
    id: "t-wadi-jin",
    from: "Wadi Jin",
    to: "Madinah Ziyarat",
    category: "Ziyarat",
    prices: { car: 285, staria: 420, gmc: 500, hiace: 560, coaster: 615 },
  },
  {
    id: "t-mak-ziyarat",
    from: "Makkah Hotel",
    to: "Makkah Ziyarat",
    category: "Ziyarat",
    prices: { car: 220, staria: 360, gmc: 430, hiace: 490, coaster: 540 },
  },
  {
    id: "t-jed-mad",
    from: "Jeddah Airport",
    to: "Madinah Hotel",
    category: "Airport",
    prices: { car: 650, staria: 850, gmc: 980, hiace: 1100, coaster: 1250 },
  },
  {
    id: "t-mad-air",
    from: "Madinah Hotel",
    to: "Madinah Airport",
    category: "Airport",
    prices: { car: 130, staria: 220, gmc: 270, hiace: 320, coaster: 360 },
  },
];

export const transportStats = {
  total: 100,
  vehicleGroups: 5,
  partners: 1,
  lowest: 115,
};
