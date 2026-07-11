import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminThemeProvider>{children}</AdminThemeProvider>;
}
