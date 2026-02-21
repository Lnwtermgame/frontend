"use client";

import React, { ReactNode } from "react";
import { motion, AnimatePresence } from "@/lib/framer-exports";
import { pageTransition } from "@/lib/framer-exports";

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export default function PageTransition({
  children,
  className = "",
}: PageTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Layout component that combines AnimatePresence with page transitions
interface AnimatedLayoutProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedLayout({
  children,
  className = "",
}: AnimatedLayoutProps) {
  return (
    <AnimatePresence mode="wait">
      <PageTransition className={className}>{children}</PageTransition>
    </AnimatePresence>
  );
}
