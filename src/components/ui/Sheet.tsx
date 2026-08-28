"use client";

import * as React from "react";
import { createPortal } from "react-dom";
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
  const titleId = React.useId();

  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  const sideClasses = {
    left: "top-0 bottom-0 left-0 w-[85vw] max-w-sm border-r",
    right: "top-0 bottom-0 right-0 w-[85vw] max-w-sm border-l",
    bottom: "bottom-0 left-0 right-0 max-h-[90vh] border-t rounded-t-12",
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[60]"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-black/60"
        aria-hidden="true"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        className={cn(
          "fixed z-[70] flex flex-col overflow-hidden bg-site-surface border-site-border",
          sideClasses[side],
          className,
        )}
      >
        {side === "bottom" && (
          <div className="w-10 h-1 bg-site-border rounded-full mx-auto mt-3 mb-2 shrink-0" aria-hidden="true" />
        )}

        <header className="flex items-center justify-between gap-4 p-4 border-b border-site-border shrink-0">
          {title ? (
            <h2 id={titleId} className="font-semibold text-lg truncate">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-8 text-site-muted hover:bg-site-raised hover:text-site-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/40"
            aria-label="Close"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </section>
    </div>,
    document.body,
  );
}