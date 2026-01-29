"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function StarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My STAR">
      {children}
    </UserLayout>
  );
} 