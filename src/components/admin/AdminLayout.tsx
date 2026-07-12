"use client";

/**
 * AdminLayout is now a PASS-THROUGH — the actual shell (sidebar + topbar +
 * auth gate) lives in AdminShell, which is mounted ONCE in the admin route
 * group layout and persists across navigations.
 *
 * This component is kept for backward compat: all 26 admin pages still
 * import and render <AdminLayout>. It simply renders children directly,
 * avoiding a double-nested shell. Pages can be gradually migrated to drop
 * this wrapper entirely.
 */
export function AdminLayout({
  children,
  title: _title,
}: {
  children?: React.ReactNode;
  title?: unknown; // accepted for backward compat, ignored
}) {
  return <>{children}</>;
}
