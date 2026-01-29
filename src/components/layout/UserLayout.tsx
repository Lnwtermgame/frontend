"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import UserSidebar from "@/components/account/UserSidebar";
import { motion } from "@/lib/framer-exports";

interface UserLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function UserLayout({ children, title }: UserLayoutProps) {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="page-container text-center">
        <div className="bg-mali-card rounded-xl border border-mali-blue/20 p-8">
          <div className="animate-pulse flex space-x-4 justify-center">
            <div className="rounded-full bg-mali-blue/20 h-12 w-12"></div>
            <div className="flex-1 space-y-4 max-w-md">
              <div className="h-4 bg-mali-blue/20 rounded w-3/4"></div>
              <div className="h-4 bg-mali-blue/20 rounded"></div>
              <div className="h-4 bg-mali-blue/20 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {title && (
        <motion.h1
          className="text-2xl font-bold text-white mb-6 thai-font"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {title}
        </motion.h1>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          className="col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-mali-card rounded-xl border border-mali-blue/20 sticky top-24 overflow-hidden">
            <UserSidebar />
          </div>
        </motion.div>

        {/* Main content */}
        <motion.div
          className="col-span-1 md:col-span-3 space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
