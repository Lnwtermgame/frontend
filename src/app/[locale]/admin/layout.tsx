import Script from "next/script";
import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import { AdminShell } from "@/components/admin/AdminShell";

/** Inline no-flash: runs before paint (beforeInteractive). Key must match THEME_STORAGE_KEY. */
const NO_FLASH_SCRIPT = `(function(){try{var k='admin-theme';var s=localStorage.getItem(k);var t;if(s){t=JSON.parse(s);}else{t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Script id="admin-theme-noflash" strategy="beforeInteractive">
        {NO_FLASH_SCRIPT}
      </Script>
      <AdminThemeProvider>
        <AdminShell>{children}</AdminShell>
      </AdminThemeProvider>
    </>
  );
}
