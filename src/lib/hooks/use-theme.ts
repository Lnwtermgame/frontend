"use client";

import { useCallback } from "react";

export type Theme = "dark" | "light";
export const THEME_STORAGE_KEY = "admin-theme";

/**
 * Dark-only theme hook.
 *
 * The storefront and admin are now dark-only. This hook retains its API shape
 * so existing consumers (AdminThemeProvider, AdminTopbar) compile without
 * changes, but it always reports "dark" and never mutates the DOM.
 */
export function useTheme() {
  const theme: Theme = "dark";

  const setTheme = useCallback((_next: Theme) => {
    // no-op: dark-only
  }, []);

  const toggleTheme = useCallback(() => {
    // no-op: dark-only
  }, []);

  return { theme, setTheme, toggleTheme };
}
