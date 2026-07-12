"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

/**
 * Wraps the admin area.
 *
 * - Calls useTheme() ONCE (the single source of truth for data-theme).
 * - Exposes theme + toggleTheme via context so AdminTopbar can read it
 *   WITHOUT calling useTheme() again (which would create a second state
 *   instance and cause data-theme write races → flicker).
 * - On unmount: resets <html> to dark so the storefront never inherits
 *   admin's light theme.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.dataset.theme = "dark";
      }
    };
  }, []);

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

/** Read theme from AdminThemeProvider context. Throws if used outside admin. */
export function useAdminTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAdminTheme must be used within AdminThemeProvider");
  }
  return ctx;
}
