/** @type {import('tailwindcss').Config} */
const animate = require("tailwindcss-animate");

module.exports = {
  darkMode: ["class"],
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
        // shadcn/ui tokens (bg-background, text-primary, border-border, …)
        // backed by the CSS variables defined in globals.css.
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        4: "4px",
        6: "6px",
        8: "8px",
        10: "10px",
        12: "12px",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["'Noto Sans Thai'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        // Keep the legacy utility available without the former oversized glow.
        ocean: "0 1px 2px rgba(0, 0, 0, 0.18)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [animate],
};
