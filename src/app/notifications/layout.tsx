"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="Notifications">
      {children}
    </UserLayout>
  );
} 
