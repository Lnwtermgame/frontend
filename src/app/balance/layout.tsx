"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function BalanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="SEAGM Balance">
      {children}
    </UserLayout>
  );
} 
