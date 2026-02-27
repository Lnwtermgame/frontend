"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { motion } from "@/lib/framer-exports";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  side?: "left" | "right" | "bottom";
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  side = "bottom",
  className,
}: SheetProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Animation variants based on side
  const variants = {
    left: { x: "-100%", y: 0 },
    right: { x: "100%", y: 0 },
    bottom: { x: 0, y: "100%" },
  };

  const active = { x: 0, y: 0 };

  const sideClasses = {
    left: "top-0 bottom-0 left-0 w-[85vw] max-w-sm border-r-[3px]",
    right: "top-0 bottom-0 right-0 w-[85vw] max-w-sm border-l-[3px]",
    bottom: "bottom-0 left-0 right-0 h-[90vh] rounded-t-2xl border-t-[3px]",
  };

  if (!mounted) return null;

  return createPortal(
    isOpen && (
      <>
        {/* Backdrop */}
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
        />

        {/* Sheet */}
        <div
          className={cn(
            "fixed bg-white z-[70] border-black shadow-2xl flex flex-col transition-transform duration-300",
              sideClasses[side],
              className,
            )}
          >
            {/* Handle for bottom sheet */}
            {side === "bottom" && (
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-2 flex-shrink-0" />
            )}

            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b-[2px] border-gray-100 flex-shrink-0 bg-white">
              {title ? (
                <h2 className="font-black text-xl line-clamp-1">{title}</h2>
              ) : (
                <div />
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 safe-area-bottom">
              {children}
            </div>
          </div>
        </>
      ),
    document.body,
  );
}
