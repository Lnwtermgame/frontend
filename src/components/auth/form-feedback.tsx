import * as React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";

/**
 * ข้อความ feedback ของฟอร์ม auth — แยกบทบาทให้ชัดเพื่อไม่ให้ซ้อนกัน:
 *  - FieldError = ข้อผิดพลาดของ "ช่องเดียว" (อยู่ใต้ช่อง, ตัวเล็ก, มีไอคอน)
 *  - FormAlert  = ข้อความระดับ "ฟอร์ม" (กล่องเต็มความกว้าง วางเหนือปุ่มส่ง / ใต้หัวข้อ)
 */

/** ข้อผิดพลาดใต้ช่อง input — ผูกกับช่องด้วย id เพื่อใช้กับ aria-describedby */
export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-xs leading-normal text-destructive animate-in fade-in slide-in-from-top-1 duration-150"
    >
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{message}</span>
    </p>
  );
}

const ALERT_STYLES = {
  error: {
    icon: AlertCircle,
    box: "border-destructive/40 bg-destructive/10 text-destructive",
    role: "alert" as const,
  },
  warning: {
    icon: AlertTriangle,
    box: "border-amber-500/40 bg-amber-500/10 text-amber-400",
    role: "alert" as const,
  },
  success: {
    icon: CheckCircle2,
    box: "border-status-success/40 bg-status-success/10 text-status-success",
    role: "status" as const,
  },
};

/** กล่องแจ้งเตือนระดับฟอร์ม (เช่น อีเมล/รหัสผ่านไม่ถูกต้อง, เซสชันหมดอายุ) */
export function FormAlert({
  variant = "error",
  children,
  className = "",
}: {
  variant?: keyof typeof ALERT_STYLES;
  children: React.ReactNode;
  className?: string;
}) {
  if (!children) return null;
  const { icon: Icon, box, role } = ALERT_STYLES[variant];
  return (
    <div
      role={role}
      className={`flex items-start gap-2.5 rounded-[10px] border px-3.5 py-3 text-sm leading-normal font-medium animate-in fade-in slide-in-from-top-1 duration-150 ${box} ${className}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/** แปลข้อความ error ภาษาอังกฤษจาก backend ที่พบบ่อย ให้เป็นภาษาไทยที่เข้าใจง่าย
 *  (คีย์อยู่ใน messages/th.json → auth.errors.*) — ผู้เรียกส่ง t จาก useTranslations("auth") เข้ามา */
const KNOWN_MESSAGES: Array<[RegExp, string]> = [
  [/invalid (email|credentials)|invalid email or password|incorrect/i, "errors.invalidCredentials"],
  [/(email|user).*(already|exists|taken|in use)/i, "errors.alreadyExists"],
  [/too many|rate limit/i, "errors.rateLimited"],
  [/network|failed to fetch|fetch failed/i, "errors.network"],
  [/internal server|server error|50\d/i, "errors.serverError"],
];

export function localizeAuthError(
  message: string | null | undefined,
  fallback: string,
  t: (key: string) => string,
): string {
  if (!message) return fallback;
  // มีตัวอักษรไทยอยู่แล้ว = backend/store แปลมาแล้ว ใช้ตามนั้น
  if (/[\u0E00-\u0E7F]/.test(message)) return message;
  for (const [pattern, key] of KNOWN_MESSAGES) {
    if (pattern.test(message)) return t(key);
  }
  return fallback;
}
