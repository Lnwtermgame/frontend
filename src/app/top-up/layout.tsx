"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function TopUpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="Top Up">
      {children}
    </UserLayout>
  );
} 
