"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { DialogOverlay, DialogPortal } from "@/components/ui/dialog";
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

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm z-[80]" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-[90] flex w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col max-h-[90vh] bg-site-surface border border-site-border rounded-12 shadow-2xl focus:outline-none",
            SIZE[size],
          )}
          onEscapeKeyDown={(e) => loading && e.preventDefault()}
          onPointerDownOutside={(e) => loading && e.preventDefault()}
          onInteractOutside={(e) => loading && e.preventDefault()}
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-site-border-soft">
            <DialogPrimitive.Title className="text-base font-bold text-site-text">
              {title}
            </DialogPrimitive.Title>
            <DialogPrimitive.Close
              disabled={loading}
              className="p-1.5 rounded-lg text-site-dim hover:bg-site-raised hover:text-site-text disabled:opacity-40 transition-colors focus:outline-none"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t border-site-border-soft">
            <DialogPrimitive.Close asChild>
              <button
                disabled={loading}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-site-border text-site-muted hover:bg-site-raised hover:text-site-text disabled:opacity-40 transition-colors"
              >
                {resolvedCancel}
              </button>
            </DialogPrimitive.Close>
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
        </DialogPrimitive.Content>
      </DialogPortal>
    </DialogPrimitive.Root>
  );
}
