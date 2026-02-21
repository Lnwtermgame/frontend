/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
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
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        // Neo-Brutalism Lite - Candy Colors for CTAs and accents
        brutal: {
          pink: "#FF6B9D",
          yellow: "#FFD93D",
          blue: "#4ECDC4",
          green: "#95E1D3",
          black: "#000000",
          white: "#FFFFFF",
          gray: "#F5F5F5", // Updated to match prompt
          dark: "#1a1a2e",
        },
        // Legacy Mali colors (keeping for transition)
        mali: {
          dark: "#0a0b0f",
          darker: "#050608",
          navy: "#12141c",
          blue: {
            DEFAULT: "#23263a",
            light: "#2a2d45",
            accent: "#ff6b00",
            glow: "transparent",
          },
          purple: {
            DEFAULT: "#00ff94",
            dark: "#00cc76",
            glow: "transparent",
          },
          pink: "#ff0055",
          red: "#ff2a2a",
          green: "#00ff94",
          card: "#12141c",
          sidebar: "#0e1016",
          sidebar2: "#12141c",
          text: {
            primary: "#ffffff",
            secondary: "#9ca3af",
            muted: "#6b7280",
          },
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        thai: ["var(--font-thai)"],
        poppins: ["Poppins", "system-ui", "sans-serif"],
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "brutal-pink": "linear-gradient(135deg, #FF6B9D 0%, #ff8fab 100%)",
        "brutal-yellow": "linear-gradient(135deg, #FFD93D 0%, #ffe066 100%)",
        "brutal-blue": "linear-gradient(135deg, #4ECDC4 0%, #6ee7df 100%)",
        "brutal-green": "linear-gradient(135deg, #95E1D3 0%, #a7f3d0 100%)",
        "brutal-dark": "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        // Legacy gradients
        "mali-gradient": "linear-gradient(180deg, #0a0b0f 0%, #0a0b0f 100%)",
        "card-gradient": "linear-gradient(180deg, #12141c 0%, #12141c 100%)",
        "button-gradient": "linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%)",
        "accent-gradient": "linear-gradient(90deg, #00ff94 0%, #00d179 100%)",
        "game-card-gradient":
          "linear-gradient(to top, rgba(18, 20, 28, 0.95) 0%, rgba(18, 20, 28, 0) 100%)",
        "glow-gradient": "none",
      },
      spacing: {
        18: "4.5rem", // 72px - touch target
        22: "5.5rem", // 88px - large buttons
      },
      screens: {
        xs: "375px", // iPhone SE
        sm: "640px", // Large phones
        md: "768px", // Tablets
        lg: "1024px", // Laptops
        xl: "1280px", // Desktops
        "2xl": "1536px", // Large screens
      },
      fontSize: {
        "mobile-h1": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }], // 24px
        "mobile-h2": ["1.25rem", { lineHeight: "1.75rem", fontWeight: "600" }], // 20px
        "mobile-body": ["1rem", { lineHeight: "1.5rem" }], // 16px
        "mobile-sm": ["0.875rem", { lineHeight: "1.25rem" }], // 14px
      },
      boxShadow: {
        // Neo-Brutalist offset shadows
        brutal: "4px 4px 0 0 #000000",
        "brutal-sm": "2px 2px 0 0 #000000",
        "brutal-lg": "6px 6px 0 0 #000000",
        "brutal-hover": "6px 6px 0 0 #000000",
        "brutal-active": "2px 2px 0 0 #000000",
        "brutal-pink": "4px 4px 0 0 #FF6B9D",
        "brutal-yellow": "4px 4px 0 0 #FFD93D",
        "brutal-blue": "4px 4px 0 0 #4ECDC4",
        "brutal-green": "4px 4px 0 0 #95E1D3",
        // Legacy shadows
        "button-glow": "none",
        "blue-glow": "none",
        "purple-glow": "none",
        "card-hover": "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        bento: "0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)",
      },
      borderWidth: {
        brutal: "3px",
        "brutal-thick": "4px",
      },
      transitionTimingFunction: {
        brutal: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      animation: {
        "bounce-small": "bounce-small 0.3s ease-in-out",
      },
      keyframes: {
        "bounce-small": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        html: {
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
      });
    },
  ],
};
