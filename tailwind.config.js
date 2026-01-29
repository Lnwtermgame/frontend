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
        // MaliGamePass theme colors - Refined to perfectly match reference UI
        mali: {
          dark: "#0e1633",        // Main background color
          darker: "#0a1029",      // Darker background variant
          navy: "#1a2547",        // Secondary background color
          blue: {
            DEFAULT: "#2a3f66",   // Border color and lighter backgrounds
            light: "#4e89e8",     // Lighter blue accents
            accent: "#3a7bec",    // Main blue accent color
            glow: "#4e89e8"       // Glowing accent for hover effects
          },
          purple: {
            DEFAULT: "#7953f5",   // Purple accent
            dark: "#6237d0",      // Darker purple
            glow: "#7953f580"     // Purple glow for effects
          },
          pink: "#e936a2",        // Pink accent
          red: "#ff4655",         // Red accent (from valorant)
          green: "#28c76f",       // Success color
          card: "#192545",        // Card background color
          sidebar: "#101b33",     // Sidebar background color
          sidebar2: "#182040",    // Alternative sidebar color
          text: {
            primary: "#ffffff",   // Main text color
            secondary: "#a7b1d9", // Secondary text color
            muted: "#6a7199"      // Muted text color
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
        'mali-gradient': 'linear-gradient(180deg, #0e1633 0%, #1a2547 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(42, 63, 102, 0.8) 0%, rgba(26, 37, 71, 0.8) 100%)',
        'button-gradient': 'linear-gradient(135deg, #4e89e8 0%, #7953f5 100%)',
        'accent-gradient': 'linear-gradient(135deg, #e936a2 0%, #7953f5 100%)',
        'game-card-gradient': 'linear-gradient(to top, rgba(14, 22, 51, 0.95) 0%, rgba(14, 22, 51, 0) 100%)',
        'glow-gradient': 'radial-gradient(circle, rgba(78,137,232,0.3) 0%, rgba(121,83,245,0.1) 50%, rgba(14,22,51,0) 70%)',
      },
      boxShadow: {
        'button-glow': '0 0 15px rgba(78,137,232,0.5)',
        'blue-glow': '0 0 8px rgba(58,123,236,0.6)',
        'purple-glow': '0 0 12px rgba(121,83,245,0.5)',
        'card-hover': '0 4px 20px rgba(26, 32, 77, 0.4)',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: 0.8 },
          '50%': { opacity: 1 },
        },
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