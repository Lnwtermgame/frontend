"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";

/** Input รหัสผ่านพร้อมปุ่ม 👁 แสดง/ซ่อน — ใช้กับ react-hook-form ได้ (ref ผ่าน props) */
export function PasswordInput({ className, ...props }: React.ComponentProps<"input">) {
  const t = useTranslations("auth");
  const [show, setShow] = React.useState(false);

  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        className={`pr-11 ${className ?? ""}`}
        {...props}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? t("hidePassword") : t("showPassword")}
        className="absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-[8px] text-muted-foreground transition-colors hover:text-foreground"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}
