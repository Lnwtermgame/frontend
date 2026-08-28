"use client";

import { createContext, useMemo } from "react";
import { useTheme, type Theme } from "@/lib/hooks/use-theme";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
} | null>(null);

/**
 * Wraps the admin area.
 *
 * Dark-only: no longer writes any theme attribute to the DOM. Kept as a context
 * provider so any admin component can read the theme value without importing
 * the hook directly.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useTheme();

  const value = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
