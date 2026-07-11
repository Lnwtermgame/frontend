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
        site: {
          bg: "var(--site-bg)",
          surface: "var(--site-surface)",
          raised: "var(--site-raised)",
          border: "var(--site-border)",
          "border-soft": "var(--site-border-soft)",
          accent: "var(--site-accent)",
          "accent-hover": "var(--site-accent-hover)",
          text: "var(--site-text)",
          muted: "var(--site-muted)",
          dim: "var(--site-dim)",
        },
        semantic: {
          blue: "var(--semantic-blue)",
          violet: "var(--semantic-violet)",
          green: "var(--semantic-green)",
          amber: "var(--semantic-amber)",
          rose: "var(--semantic-rose)",
        },
        brutal: {
          yellow: "#22D3EE",
          pink: "#F472B6",
          green: "#34D399",
          blue: "#38BDF8",
        },
      },
      borderRadius: {
        "12": "12px",
        "10": "10px",
      },
      fontFamily: {
        sans: ["'Manrope'", "'IBM Plex Sans Thai'", "'Poppins'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
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
