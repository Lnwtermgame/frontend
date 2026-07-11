"use client";

import { AlertTriangle } from "lucide-react";
import { FormModal } from "./FormModal";

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
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <FormModal
      open={open}
      onClose={onClose}
      onSubmit={onConfirm}
      title={title}
      submitLabel={confirmLabel}
      cancelLabel={cancelLabel}
      loading={loading}
      size="sm"
    >
      <div className="flex gap-3">
        {destructive && (
          <div className="shrink-0 w-9 h-9 rounded-full bg-semantic-rose/10 border border-semantic-rose/20 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-semantic-rose" />
          </div>
        )}
        <p className="text-sm text-site-muted leading-relaxed pt-1">
          {description ?? title}
        </p>
      </div>
    </FormModal>
  );
}
