"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations();
  const titleId = React.useId();
  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-black/60" />
        <DialogPrimitive.Content
          aria-labelledby={title ? titleId : undefined}
          aria-describedby={undefined}
          className={cn(
            "fixed z-[70] flex flex-col overflow-hidden border-site-border bg-site-surface focus:outline-none",
            side === "bottom" &&
              "bottom-0 left-0 right-0 max-h-[90vh] rounded-t-12 border-t",
            side === "left" && "top-0 bottom-0 left-0 w-[85vw] max-w-sm border-r",
            side === "right" && "top-0 bottom-0 right-0 w-[85vw] max-w-sm border-l",
            className,
          )}
        >
          <DialogPrimitive.Title id={titleId} className="sr-only">
            {title}
          </DialogPrimitive.Title>

          {side === "bottom" && (
            <div
              className="w-10 h-1 bg-site-border rounded-full mx-auto mt-3 mb-2 shrink-0"
              aria-hidden="true"
            />
          )}

          <header className="flex items-center justify-between gap-4 p-4 border-b border-site-border shrink-0">
            {title ? (
              <h2 className="font-semibold text-lg truncate">{title}</h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-8 text-site-muted hover:bg-site-raised hover:text-site-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/40"
              aria-label={t("close")}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto p-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
