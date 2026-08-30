"use client";

import { AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const t = useTranslations("Admin");
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next && !loading) onClose();
      }}
    >
      <AlertDialogContent
        className="max-w-md rounded-12 sm:rounded-12 bg-site-surface border-site-border text-site-text gap-3"
        onEscapeKeyDown={(e) => loading && e.preventDefault()}
      >
        <AlertDialogHeader className="text-left space-y-3">
          <AlertDialogTitle className="text-base font-bold text-site-text">
            {title}
          </AlertDialogTitle>
          <div className="flex gap-3">
            {destructive && (
              <div className="shrink-0 w-9 h-9 rounded-full bg-semantic-rose/10 border border-semantic-rose/20 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-semantic-rose" />
              </div>
            )}
            <AlertDialogDescription className="text-sm text-site-muted leading-relaxed pt-1">
              {description ?? title}
            </AlertDialogDescription>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            disabled={loading}
            className="h-auto rounded-lg border-site-border px-4 py-2 text-sm font-medium text-site-muted hover:bg-site-raised hover:text-site-text disabled:opacity-40"
          >
            {cancelLabel ?? t("actions.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              // Keep the dialog open; the consumer closes it via `open`
              // after the async action settles (loading spinner stays visible).
              e.preventDefault();
              onConfirm();
            }}
            className={cn(
              "h-auto rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-60 inline-flex items-center gap-2",
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
            {confirmLabel ?? t("actions.confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
