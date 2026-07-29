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
  social: {
    // Canonical profile URL. The client supplied a /share/1CoapFF7fA/ short
    // link; that redirects here, and the resolved form doesn't depend on a
    // share token that Facebook can regenerate.
    facebook: "https://www.facebook.com/people/Sasta-Travel-Express/61592189601742/",
    // QR tracking params (utm_source=qr&igsh=…) stripped on purpose — they came
    // from scanning the printed QR, and leaving them on a site-wide link would
    // report all website traffic as QR traffic in Instagram's insights.
    instagram: "https://www.instagram.com/sastatravelexpress",
    // Not set up yet. Left null rather than "#": see socialLinks below.
    youtube: null,
  },
} as const;

/**
 * Social icons to render, in order. An entry without a URL is dropped rather
 * than rendered pointing at "#" — a dead icon looks live and wastes a click.
 * Add the YouTube URL in `site.social` and the icon appears by itself.
 */
export interface SocialLink {
  icon: string;
  href: string;
  label: string;
}

// Widened to `string | null` up front: `site` is `as const`, so without this the
// literal types make the narrowing predicate below unassignable.
const allSocials: { icon: string; href: string | null; label: string }[] = [
  { icon: "public", href: site.social.facebook, label: "Facebook" },
  { icon: "photo_camera", href: site.social.instagram, label: "Instagram" },
  { icon: "smart_display", href: site.social.youtube, label: "YouTube" },
];

export const socialLinks: SocialLink[] = allSocials.filter(
  (s): s is SocialLink => Boolean(s.href),
);

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
