/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
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
        // SEAGM-inspired Gaming Theme - Flat, High Contrast, Bento Grid
        mali: {
          dark: "#0a0b0f",        // Main background - Very dark blue-black
          darker: "#050608",      // Darker background variant
          navy: "#12141c",        // Card background
          blue: {
            DEFAULT: "#23263a",   // Borders / Dividers
            light: "#2a2d45",     // Hover states
            accent: "#ff6b00",    // Primary Orange Accent (Replaces Blue Accent)
            glow: "transparent"   // Removed glow
          },
          purple: {
            DEFAULT: "#00ff94",   // Secondary Green Accent (Replaces Purple)
            dark: "#00cc76",      // Darker Green
            glow: "transparent"   // Removed glow
          },
          pink: "#ff0055",        // Error / Hot
          red: "#ff2a2a",         // Notification / Sale
          green: "#00ff94",       // Success
          card: "#12141c",        // Main card background
          sidebar: "#0e1016",     // Sidebar background
          sidebar2: "#12141c",    // Alternative sidebar
          text: {
            primary: "#ffffff",   // High contrast white
            secondary: "#9ca3af", // Neutral grey for secondary text
            muted: "#6b7280"      // Darker muted text
          }
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
        'mali-gradient': 'linear-gradient(180deg, #0a0b0f 0%, #0a0b0f 100%)', // Flat
        'card-gradient': 'linear-gradient(180deg, #12141c 0%, #12141c 100%)', // Flat
        'button-gradient': 'linear-gradient(90deg, #ff6b00 0%, #ff8c00 100%)', // Vibrant Orange
        'accent-gradient': 'linear-gradient(90deg, #00ff94 0%, #00d179 100%)', // Vibrant Green
        'game-card-gradient': 'linear-gradient(to top, rgba(18, 20, 28, 0.95) 0%, rgba(18, 20, 28, 0) 100%)',
        'glow-gradient': 'none', // Removed
      },
      boxShadow: {
        'button-glow': 'none', // Removed
        'blue-glow': 'none', // Removed
        'purple-glow': 'none', // Removed
        'card-hover': '0 10px 30px -10px rgba(0, 0, 0, 0.5)', // Deep, sharp shadow
        'bento': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)', // Subtle depth
      },
      animation: {
        // Removed pulse-glow
      },
      keyframes: {
        // Removed pulse-glow
      },
    },
  },
  plugins: [
    function({ addBase }) {
      addBase({
        'html': { 
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      })
    }
  ],
} 