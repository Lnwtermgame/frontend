/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ══════════════════════════════════════
           Ocean Blue (ทะเลฟ้าสีคราม) Theme
           Deep sea → bright cyan accent
           ══════════════════════════════════════ */
        site: {
          bg: "#16181A",       // SEAGM base dark background
          surface: "#222427",  // SEAGM card/container
          raised: "#292B2E",   // SEAGM inactive tab/floating boxes
          border: "#33353b",   // SEAGM subtle borders
          accent: "var(--site-accent)",   // Dynamic Brand Theme
          "accent-hover": "var(--site-accent-hover)", // Dynamic Hover State
          "accent-soft": "#33353b",  // SEAGM tab border 
          text: "#ffffff",     // Pure white for text
          muted: "#d1d5db",    // Light grey
          subtle: "#a1a1aa",   // Darker grey
          dim: "#71717a",      // Inactive elements
        },
        /* Legacy brutalist colors — remapped to ocean theme
           so old pages (games, support, etc.) render correctly */
        brutal: {
          yellow: "#22D3EE",    // Accent badge
          pink: "#F472B6",    // Status badges
          green: "#34D399",    // Success states
          blue: "#38BDF8",    // Info states
        },
      },
      fontFamily: {
        sans: ["'Manrope'", "var(--font-kanit)", "'Poppins'", "sans-serif"],
      },
      boxShadow: {
        ocean: "0 4px 30px rgba(8, 23, 34, 0.5)",
        glow: "0 0 20px rgba(34, 211, 238, 0.15)",
        "accent-glow": "0 0 15px var(--site-accent-glow)",
      },
    },
  },
  plugins: [],
};
