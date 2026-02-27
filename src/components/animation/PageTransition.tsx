"use client";

import React, { ReactNode } from "react";
import { motion } from "@/lib/framer-exports";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

// Layout component that combines page transitions
interface AnimatedLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedLayout({
  children,
  className = "",
}: AnimatedLayoutProps) {
  return (
    <PageTransition className={className}>{children}</PageTransition>
  );
}
