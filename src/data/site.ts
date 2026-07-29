/**
 * Central site configuration: brand, contact, navigation.
 * Single source of truth so contact details never drift between pages.
 */

export const site = {
  name: "Sasta Travel Express",
  shortName: "STE",
  tagline: "Your Trusted Gateway to the Haram",
  description:
    "Umrah packages from Pakistan with Makkah and Madinah hotel options, live seat availability, visa processing, and Saudi ground transport.",
  phone: "+92 339 0278667",
  phoneHref: "tel:+923390278667",
  whatsappHref: "https://wa.me/923390278667",
  address: "L 36, Block 3-A, Gulistan-e-Johar, Karachi, Sindh, Pakistan",
  hours: "11:00 AM – 10:00 PM (Sunday Closed)",
  // Soft Talbiyah recitation for the floating Talbiyah panel. Never autoplays —
  // it only sounds after the visitor presses play. If the file is ever missing
  // the panel hides its sound control and shows the Talbiyah text only.
  // Keep the filename ASCII and space-free — see public/audio/README.md.
  talbiyahAudioSrc: "/audio/talbiyah.mp3",
  // TODO: swap in the real profile URLs once available — placeholders for now.
  social: {
    facebook: "#",
    instagram: "#",
    youtube: "#",
  },
} as const;

export const mainNav = [
  { label: "Home", href: "/home" },
  { label: "Umrah Packages", href: "/" },
  { label: "Hotels", href: "/saudi-hotels" },
  { label: "Transport", href: "/saudi-transport" },
  { label: "Visas", href: "/visas" },
  { label: "Calculator", href: "/calculator" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export const stats = [
  { value: "15", suffix: "yrs", label: "Trusted Service" },
  { value: "3,500", suffix: "+", label: "Happy Travelers" },
  { value: "2,500", suffix: "+", label: "Tours Completed" },
  { value: "99.5", suffix: "%", label: "Positive Reviews" },
] as const;
