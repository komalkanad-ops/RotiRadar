/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Shares RotiRadar's palette so the console reads as the same product. The customer-facing
        // warmth is dialled down for a dense operations tool.
        atta: { DEFAULT: "#F7F1E4", deep: "#EFE5D0" },
        char: { DEFAULT: "#20211C", soft: "#55524A" },
        roti: { DEFAULT: "#E4A11B", deep: "#B37D0C" },
        flame: { DEFAULT: "#1C6DD0", soft: "#E7F0FB" },
        chutney: "#4E7A3F",
        clay: "#B0492B",
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
