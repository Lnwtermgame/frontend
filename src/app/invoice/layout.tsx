"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function InvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Invoice">
      {children}
    </UserLayout>
  );
} 