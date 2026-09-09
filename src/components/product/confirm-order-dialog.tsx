"use client";

import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatTHB } from "@/lib/pricing";

export function ConfirmOrderDialog({
  open,
  onOpenChange,
  packageName,
  quantity,
  total,
  onConfirm,
  buying,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  packageName: string;
  quantity: number;
  total: number;
  onConfirm: () => void;
  buying: boolean;
}) {
  const t = useTranslations("product");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("confirmTitle")}</DialogTitle>
          <DialogDescription>{t("confirmBody")}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between rounded-[10px] border p-3 text-sm">
          <span className="font-semibold">{packageName}</span>
          <span className="num">×{quantity}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{t("subtotal")}</span>
          <span className="num text-lg font-bold text-primary">{formatTHB(total)}</span>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={buying}>
            {t("cancel")}
          </Button>
          <Button onClick={onConfirm} disabled={buying}>
            {buying ? t("buying") : t("confirmBuy")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
