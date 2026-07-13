/**
 * Static UI vocabulary for the Umrah Packages card footer. Departure cities and
 * airlines are admin-managed and DB-backed — see src/lib/data/cities.ts and
 * src/lib/data/airlines.ts. Package records, stats, and testimonials are also
 * DB-backed — see src/lib/data/.
 */

/** Services bundled into every Umrah package. */
export const includedServices = [
  "Accommodation",
  "Transport",
  "Visa",
  "Return Ticket",
] as const;
