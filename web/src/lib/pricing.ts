/**
 * Pricing model — single source of truth for the website, matching the live rotiradar.in copy.
 * The backend seed (`backend/seed/seed.ts`) mirrors the amounts. Every tier is billed per visit,
 * in the app; there are no subscriptions.
 */
export interface Tier {
  id: "basic" | "sabzi" | "full";
  name: string;
  blurb: string;
  priceLabel: string;
  /** amount in paise */
  amountPaise: number;
  duration: string;
  includes: string[];
  popular?: boolean;
}

export const TIERS: Tier[] = [
  {
    id: "basic",
    name: "Roti • Dal • Rice",
    blurb: "The everyday essential — a hot, fresh tiffin-style meal.",
    priceLabel: "₹199",
    amountPaise: 19900,
    duration: "60-minute visit",
    includes: [
      "10–12 puffed phulka rotis",
      "Dal tadka & steamed rice",
      "Cooked with your ingredients",
      "Kitchen wiped down after",
    ],
  },
  {
    id: "sabzi",
    name: "Sabzi Prep",
    blurb: "A week of vegetables, sorted in one visit.",
    priceLabel: "₹499",
    amountPaise: 49900,
    duration: "Up to 2 hours",
    popular: true,
    includes: [
      "2–3 seasonal sabzis",
      "Chopped, cooked & stored",
      "Masala base for the week",
      "Fridge-ready packing",
    ],
  },
  {
    id: "full",
    name: "Full Meal",
    blurb: "A 3–5 course spread for family dinners & guests.",
    priceLabel: "₹999",
    amountPaise: 99900,
    duration: "Up to 2 hours",
    includes: [
      "3–5 course menu of your choice",
      "Serves 4–6 people",
      "Festive & regional menus",
      "Serving & full clean-up",
    ],
  },
];

/** Dishes for the scrolling strip under the hero. */
export const DISHES = [
  "Phulka Rotis",
  "Dal Tadka",
  "Jeera Rice",
  "Paneer Butter Masala",
  "Aloo Gobi",
  "Rajma Chawal",
  "Bhindi Fry",
  "Chole",
  "Veg Pulao",
  "Palak Paneer",
  "Kadhi",
  "Gulab Jamun",
];
