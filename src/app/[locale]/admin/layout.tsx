import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminRouteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminThemeProvider>
      <AdminShell>{children}</AdminShell>
    </AdminThemeProvider>
  );
}
