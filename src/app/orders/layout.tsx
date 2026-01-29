"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Orders">
      {children}
    </UserLayout>
  );
} 