/** Visa price tiers are DB-backed — see src/lib/data/visas.ts. */

export const visaFaqs = [
  {
    q: "Which language should I use for the application?",
    a: "The online application system only supports applications made in English. Please enter all details using English characters.",
  },
  {
    q: "Can I save my application and finish it later?",
    a: "Yes. Use the 'Save & Exit' option at any stage. You will receive a unique Visa Application ID by email which you use to resume your application within 7 days.",
  },
  {
    q: "Can I edit my application after submitting?",
    a: "Changes are only allowed before final submission. Once an application is submitted it cannot be modified, so please review all details carefully.",
  },
  {
    q: "What date format is required?",
    a: "All dates must be entered in dd/mm/yyyy format, for example 21/08/2026.",
  },
  {
    q: "I did not receive a confirmation email. What should I do?",
    a: "First check your spam folder. If the confirmation email has not arrived within 24 hours, contact our support team and we will resend it.",
  },
  {
    q: "How long does processing take?",
    a: "Standard Umrah e-visa processing takes approximately 7 days from submission of complete documents.",
  },
];

export const visaTypes = [
  {
    type: "Umrah",
    title: "Umrah Visa",
    icon: "mosque",
    blurb: "E-visa for pilgrims travelling for Umrah, with 20, 28, and 80 day validity options.",
    available: true,
  },
  {
    type: "Hajj",
    title: "Hajj Visa",
    icon: "kaaba",
    blurb: "Seasonal Hajj visa processing handled by our dedicated documentation team.",
    available: false,
  },
  {
    type: "Tour",
    title: "Tour Visa",
    icon: "travel_explore",
    blurb: "Tourist visa assistance for leisure and family travel to Saudi Arabia.",
    available: false,
  },
  {
    type: "Arrival",
    title: "Visa on Arrival",
    icon: "flight_land",
    blurb: "Guidance on eligibility and requirements for visa-on-arrival entry.",
    available: false,
  },
] as const;
