"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function MyCardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Cards">
      {children}
    </UserLayout>
  );
} 