import type { QA } from "../components/FaqAccordion";

/**
 * Keep every answer to what actually ships today. RotiRadar is in early access in Pune with a
 * small cook roster — don't imply scale, speed, or safety features that aren't live. See
 * docs/marketing-roadmap.md §1.
 */
export const FAQS: QA[] = [
  {
    q: "How quickly can I get a cook?",
    a: "In Pune, we confirm a cook for the slot you choose — book for later today or schedule a few days ahead. The app shows the earliest time we can commit to before you confirm. We're in early access, so availability is still limited.",
  },
  {
    q: "Who buys the groceries and ingredients?",
    a: "You do — the cook uses your kitchen and your ingredients, so the food is exactly to your taste. Keep what you want cooked ready and tell the cook when you book. A shop-for-me option is on the way.",
  },
  {
    q: "Is it safe to invite a cook into my home?",
    a: "Every cook submits government ID and photos, which we review before their first booking. Your chat is tied to the booking and can be reviewed by our team if you report a problem, and you only pay after the meal. Masked calling, live map tracking, an in-app SOS button, and visit insurance are on our roadmap as we grow.",
  },
  {
    q: "What if I need to cancel or reschedule?",
    a: "Cancelling or rescheduling is free up to a cutoff before your slot. Inside that window a small fee applies to cover the cook's committed time — the exact amount is shown in the app when you cancel.",
  },
  {
    q: "How do I pay?",
    a: "In the app, after the visit — UPI, cards, or net banking. The price and platform fee are itemised before you confirm. No cash at the door, no subscription.",
  },
  {
    q: "Which cities is RotiRadar available in?",
    a: "We're in early access in Pune, starting with a few neighbourhoods. Open the app and enter your address to see whether we can cook for you yet — if not, register your interest and we'll let you know when we reach you.",
  },
];
