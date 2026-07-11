import type { Vehicle } from "./types";

/** Static vehicle vocabulary for the transport table. Rates are DB-backed — see src/lib/data/transport.ts. */
export const vehicles: Vehicle[] = [
  { key: "car", name: "Car", capacity: "3 passengers", icon: "directions_car" },
  { key: "staria", name: "Staria / Star Ex", capacity: "7 passengers", icon: "airport_shuttle" },
  { key: "gmc", name: "GMC", capacity: "7 passengers", icon: "directions_car" },
  { key: "hiace", name: "Hiace", capacity: "9-10 passengers", icon: "airport_shuttle" },
  { key: "coaster", name: "Coaster", capacity: "On request", icon: "directions_bus" },
];
