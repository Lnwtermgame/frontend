"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function CreditsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="SEAGM Credits">
      {children}
    </UserLayout>
  );
} 
