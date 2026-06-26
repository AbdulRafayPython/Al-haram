/**
 * Central site configuration: brand, contact, navigation.
 * Single source of truth so contact details never drift between pages.
 */

export const site = {
  name: "Haram Gateway Express",
  shortName: "HGE",
  tagline: "Your Trusted Gateway to the Haram",
  description:
    "Umrah packages from Pakistan with Makkah and Madinah hotel options, live seat availability, visa processing, and Saudi ground transport.",
  phone: "+92 333 7788861",
  phoneHref: "tel:+923337788861",
  whatsappHref: "https://wa.me/923337788861",
  email: "info@haramgatewayexpress.com",
  emailHref: "mailto:info@haramgatewayexpress.com",
  address: "Office #31, Adam Arcade, Bahadurabad BMCHS Sharafabad, Karachi, Pakistan",
  hours: "11:00 AM – 10:00 PM (Sunday Closed)",
  social: {
    facebook: "https://facebook.com/haramgatewayexpressofficial",
    instagram: "https://instagram.com/haramgatewayexpresspvtltd",
    linkedin: "https://linkedin.com/company/haramgatewayexpressofficial",
  },
} as const;

export const mainNav = [
  { label: "Home", href: "/" },
  { label: "Umrah Packages", href: "/umrah-packages" },
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
