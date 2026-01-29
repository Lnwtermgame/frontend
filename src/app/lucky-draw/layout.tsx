"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function LuckyDrawLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Lucky Draw">
      {children}
    </UserLayout>
  );
} 