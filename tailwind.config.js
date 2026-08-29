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
        // Alpha-ready mappings (rgb(var(--x-rgb) / <alpha-value>)) so Tailwind
        // opacity modifiers like bg-site-accent/10 actually render. The -rgb
        // mirrors live next to the hex tokens in globals.css.
        site: {
          bg: "rgb(var(--site-bg-rgb) / <alpha-value>)",
          deep: "rgb(var(--site-deep-rgb) / <alpha-value>)",
          surface: "rgb(var(--site-surface-rgb) / <alpha-value>)",
          raised: "rgb(var(--site-raised-rgb) / <alpha-value>)",
          border: "rgb(var(--site-border-rgb) / <alpha-value>)",
          "border-soft": "rgb(var(--site-border-soft-rgb) / <alpha-value>)",
          accent: "rgb(var(--site-accent-rgb) / <alpha-value>)",
          "accent-hover": "rgb(var(--site-accent-hover-rgb) / <alpha-value>)",
          text: "rgb(var(--site-text-rgb) / <alpha-value>)",
          muted: "rgb(var(--site-muted-rgb) / <alpha-value>)",
          dim: "rgb(var(--site-dim-rgb) / <alpha-value>)",
        },
        status: {
          info: "rgb(var(--status-info-rgb) / <alpha-value>)",
          success: "rgb(var(--status-success-rgb) / <alpha-value>)",
          warning: "rgb(var(--status-warning-rgb) / <alpha-value>)",
          danger: "rgb(var(--status-danger-rgb) / <alpha-value>)",
        },
        // Compatibility aliases for existing screens. New work should use status.*.
        semantic: {
          blue: "rgb(var(--status-info-rgb) / <alpha-value>)",
          violet: "rgb(var(--status-info-rgb) / <alpha-value>)",
          green: "rgb(var(--status-success-rgb) / <alpha-value>)",
          amber: "rgb(var(--status-warning-rgb) / <alpha-value>)",
          rose: "rgb(var(--status-danger-rgb) / <alpha-value>)",
        },
      },
      borderRadius: {
        4: "4px",
        6: "6px",
        8: "8px",
        12: "12px",
      },
      fontFamily: {
        sans: ["'Noto Sans Thai'", "sans-serif"],
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
