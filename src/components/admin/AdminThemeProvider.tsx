"use client";

import { useTheme, THEME_STORAGE_KEY } from "@/lib/hooks/use-theme";

const NO_FLASH_SCRIPT = `(function(){try{var k='${THEME_STORAGE_KEY}';var s=localStorage.getItem(k);var t;if(s){t=JSON.parse(s);}else{t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

/**
 * Wraps the admin area. Renders a no-flash script (sets data-theme before paint)
 * and keeps the <html> data-theme attribute in sync with user preference.
 */
export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  useTheme();

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      {children}
    </>
  );
}
