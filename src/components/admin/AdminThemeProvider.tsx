"use client";

import { useTheme } from "@/lib/hooks/use-theme";

/**
 * Wraps the admin area. Theme application + cleanup lives in useTheme.
 * No-flash script is injected from the admin server layout (beforeInteractive).
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();
  return <>{children}</>;
}
