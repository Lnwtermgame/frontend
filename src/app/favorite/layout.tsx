"use client";

import UserLayout from "@/components/layout/UserLayout";

export default function FavoriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserLayout title="My Favorite">
      {children}
    </UserLayout>
  );
} 