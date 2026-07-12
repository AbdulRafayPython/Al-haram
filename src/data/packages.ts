/**
 * Static UI vocabulary for the Umrah Packages board filters and card footer.
 * Package records, stats, and testimonials are DB-backed — see src/lib/data/.
 */

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

/** Services bundled into every Umrah package. */
export const includedServices = [
  "Accommodation",
  "Transport",
  "Visa",
  "Return Ticket",
] as const;
