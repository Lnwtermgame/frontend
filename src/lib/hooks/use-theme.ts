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
 * Applies theme only while admin UI is mounted. On unmount, restores the dark
 * storefront default so public pages never inherit admin light tokens.
 *
 * State model:
 *  - No stored preference → prefers-color-scheme (not written until explicit toggle)
 *  - Stored preference → used directly
 */
export function useTheme() {
  const [stored, setStored, isHydrated] = useLocalStorage<Theme | null>(
    THEME_STORAGE_KEY,
    null,
  );
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    if (!isHydrated) return;
    if (stored) {
      setThemeState(stored);
    } else {
      setThemeState(resolveInitialTheme());
    }
  }, [isHydrated, stored]);

  // Apply while mounted; reset storefront to dark on leave.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.theme = theme;
    return () => {
      document.documentElement.dataset.theme = "dark";
    };
  }, [theme]);

  const setTheme = useCallback(
    (next: Theme) => {
      setThemeState(next);
      setStored(next);
    },
    [setStored],
  );

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return { theme, setTheme, toggleTheme };
}
