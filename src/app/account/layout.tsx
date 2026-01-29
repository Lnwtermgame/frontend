"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Account">
      {children}
    </UserLayout>
  );
} 
