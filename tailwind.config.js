/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      spacing: {
        "4.5": "1.125rem",
      },
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
        status: {
          info: "var(--status-info)",
          success: "var(--status-success)",
          warning: "var(--status-warning)",
          danger: "var(--status-danger)",
        },
        // Compatibility aliases for existing screens. New work should use status.*.
        semantic: {
          blue: "var(--status-info)",
          violet: "var(--status-info)",
          green: "var(--status-success)",
          amber: "var(--status-warning)",
          rose: "var(--status-danger)",
        },
      },
      borderRadius: {
        6: "6px",
        8: "8px",
        12: "12px",
      },
      fontFamily: {
        sans: ["'Manrope'", "'IBM Plex Sans Thai'", "'Poppins'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        // Keep the legacy utility available without the former oversized glow.
        ocean: "0 1px 2px rgba(0, 0, 0, 0.18)",
      },
    },
  },
  plugins: [],
};
