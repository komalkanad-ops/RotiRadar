/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Matches the live rotiradar.in identity: cream paper, dark-chocolate ink, terracotta accent.
        cream: {
          DEFAULT: "#FAF6F0", // page background
          deep: "#F1E8DC", // secondary surface / cards on cream
        },
        ink: {
          DEFAULT: "#2A1B13", // headings, body, dark sections, footer
          soft: "#736359", // muted / secondary text
        },
        terracotta: {
          DEFAULT: "#BC401A", // primary accent + CTAs + eyebrow labels
          deep: "#9E3415", // hover / pressed
        },
        paper: "#FCF8F3", // cream text on dark, and the lightest surface
        sage: "#3F6B4A", // the "insured / re-verified" trust callout only
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ['"DM Sans"', "system-ui", "sans-serif"],
      },
      fontSize: {
        hero: ["clamp(2.75rem, 6vw, 4.5rem)", { lineHeight: "1.0", letterSpacing: "-0.025em" }],
        display: ["clamp(2rem, 4vw, 3rem)", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
      },
      maxWidth: {
        prose: "62ch",
      },
      keyframes: {
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        sweep: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        marquee: "marquee 38s linear infinite",
        sweep: "sweep 2.4s cubic-bezier(0.4, 0, 0.2, 1) 2 forwards",
      },
    },
  },
  plugins: [],
};
