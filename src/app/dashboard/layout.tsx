"use client";

import UserSidebar from "@/components/account/UserSidebar";
import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion } from "@/lib/framer-exports";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isInitialized } = useAuth();

  useEffect(() => {
    if (isInitialized && !user) {
      router.push("/login");
    }
  }, [user, router, isInitialized]);

  if (!isInitialized) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">


      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <motion.aside
          className="lg:col-span-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="bg-white border-[3px] border-black overflow-hidden sticky top-24" style={{ boxShadow: '4px 4px 0 0 #000000' }}>
            <UserSidebar />
          </div>
        </motion.aside>

        <motion.main
          className="lg:col-span-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
} 
