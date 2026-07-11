"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

const SIZE: Record<string, string> = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function FormModal({
  open,
  onClose,
  title,
  onSubmit,
  submitLabel = "บันทึก",
  cancelLabel = "ยกเลิก",
  loading = false,
  size = "md",
  children,
}: FormModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !loading && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, loading, onClose]);

  if (!mounted) return null;

  return createPortal(
    open && (
      <>
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80]"
          onClick={() => !loading && onClose()}
        />
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 pointer-events-none">
          <div
            className={cn(
              "pointer-events-auto w-full bg-site-surface border border-site-border rounded-12 shadow-2xl flex flex-col max-h-[90vh]",
              SIZE[size],
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-site-border-soft">
              <h2 className="text-base font-bold text-site-text">{title}</h2>
              <button
                onClick={onClose}
                disabled={loading}
                className="p-1.5 rounded-lg text-site-dim hover:bg-site-raised hover:text-site-text disabled:opacity-40 transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            <div className="flex justify-end gap-2 px-5 py-3 border-t border-site-border-soft">
              <button
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-site-border text-site-muted hover:bg-site-raised hover:text-site-text disabled:opacity-40 transition-colors"
              >
                {cancelLabel}
              </button>
              <button
                onClick={onSubmit}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-site-accent text-site-bg hover:bg-site-accent-hover disabled:opacity-60 transition-colors inline-flex items-center gap-2"
              >
                {loading && (
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-site-bg/30 border-t-site-bg animate-spin" />
                )}
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </>
    ),
    document.body,
  );
}
