"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
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
  /** Rose-tinted confirm for destructive actions */
  destructive?: boolean;
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
  submitLabel,
  cancelLabel,
  loading = false,
  size = "md",
  destructive = false,
  children,
}: FormModalProps) {
  const t = useTranslations("Admin");
  const resolvedSubmit = submitLabel ?? t("actions.save");
  const resolvedCancel = cancelLabel ?? t("actions.cancel");
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
                {resolvedCancel}
              </button>
              <button
                onClick={onSubmit}
                disabled={loading}
                className={cn(
                  "px-4 py-2 text-sm font-semibold rounded-lg disabled:opacity-60 transition-colors inline-flex items-center gap-2",
                  destructive
                    ? "bg-semantic-rose text-white hover:bg-semantic-rose/90"
                    : "bg-site-accent text-site-bg hover:bg-site-accent-hover",
                )}
              >
                {loading && (
                  <span
                    className={cn(
                      "w-3.5 h-3.5 rounded-full border-2 animate-spin",
                      destructive
                        ? "border-white/30 border-t-white"
                        : "border-site-bg/30 border-t-site-bg",
                    )}
                  />
                )}
                {resolvedSubmit}
              </button>
            </div>
          </div>
        </div>
      </>
    ),
    document.body,
  );
}
