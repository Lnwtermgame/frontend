"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "./use-local-storage";

export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "admin-theme";

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  if (window.matchMedia("(prefers-color-scheme: light)").matches) return "light";
  return "dark";
}

/**
 * Admin theme hook.
 *
 * State model:
 *  - No stored preference → resolved from prefers-color-scheme (NOT written to storage,
 *    so an OS theme change can still flip it until the user explicitly toggles).
 *  - Stored preference → used directly.
 *
 * Note: useLocalStorage returns initialValue during SSR/hydration, so we layer a
 * "has the user chosen?" check on top. The no-flash script in AdminThemeProvider
 * sets data-theme before paint; this hook keeps React state in sync after mount.
 */
export function useTheme() {
  const [stored, setStored, isHydrated] = useLocalStorage<Theme | null>(
    THEME_STORAGE_KEY,
    null,
  );
  const [theme, setThemeState] = useState<Theme>("dark");

  // On mount: if user has a stored preference use it, else resolve from OS.
  useEffect(() => {
    if (!isHydrated) return;
    if (stored) {
      setThemeState(stored);
    } else {
      setThemeState(resolveInitialTheme());
    }
  }, [isHydrated, stored]);

  // Reflect theme to <html data-theme>.
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      setStored(next); // explicit choice → persist
    },
    [setStored],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
