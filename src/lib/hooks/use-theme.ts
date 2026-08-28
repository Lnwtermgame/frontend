"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocalStorage } from "./use-local-storage";

export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "admin-theme";

/**
 * Read the theme that the no-flash script already applied to <html>.
 * Avoids a second source of truth during hydration (no dark→light flash).
 */
function readAppliedTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

/**
 * Admin theme hook.
 *
 * Initial state is read from the DOM (set by the no-flash script), NOT from
 * useState("dark"), so there is no flash on hydration. The cleanup-on-unmount
 * reset is removed — it caused a dark flash every time `theme` changed because
 * React runs cleanup before the next effect.
 *
 * Single responsibility: this hook ONLY manages data-theme. Storefront reset
 * is handled by the route leave effect in AdminThemeProvider, not here.
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readAppliedTheme);
  const [stored, setStored, isHydrated] = useLocalStorage<Theme | null>(
    THEME_STORAGE_KEY,
    null,
  );

  // Sync from localStorage after hydration (covers cross-tab changes).
  useEffect(() => {
    if (!isHydrated) return;
    if (stored && stored !== theme) {
      const id = requestAnimationFrame(() => setThemeState(stored));
      return () => cancelAnimationFrame(id);
    }
  }, [isHydrated, stored, theme]);

  // Reflect theme to <html data-theme>. No cleanup reset — the no-flash
  // script already set the correct value before paint, and resetting on
  // unmount causes storefront pages to flash if the user navigates away.
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      setStored(next);
    },
    [setStored],
  );

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      setStored(next);
      return next;
    });
  }, [setStored]);

  return { theme, setTheme, toggleTheme };
}
