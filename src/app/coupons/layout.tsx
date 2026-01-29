"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function CouponsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Coupons">
      {children}
    </UserLayout>
  );
} 
