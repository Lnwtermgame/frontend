"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UserSidebar, { DashboardLayout } from "@/components/account/UserSidebar";
import { motion } from "@/lib/framer-exports";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  if (!isInitialized || !user) {
    return (
      <div className="page-container text-center">
        <div
          className="bg-white border-[3px] border-black p-8"
          style={{ boxShadow: "4px 4px 0 0 #000000" }}
        >
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-gray-200 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-gray-200 w-3/4"></div>
              <div className="h-4 bg-gray-200"></div>
              <div className="h-4 bg-gray-200 w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {title && (
        <motion.h1
          className="text-2xl font-black text-black mb-6 thai-font flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="w-1.5 h-6 bg-brutal-pink mr-3"></span>
          {title}
        </motion.h1>
      )}
      {children}
    </DashboardLayout>
  );
}
