"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SeagmField } from "@/lib/api/products";

/* placeholder จาก backend เป็นอังกฤษ ("Please enter User ID" หรือ "Please select Server")
 * — แปลงเป็นไทยตาม label (แปลผ่าน product.fieldPlaceholder หรือ fieldSelectPlaceholder) */
function thaiPlaceholder(
  field: SeagmField,
  t: (key: string, values: { field: string }) => string,
): string | undefined {
  if (field.type === "select") {
    if (!field.placeholder || /^please (select|enter)/i.test(field.placeholder)) {
      return t("fieldSelectPlaceholder", { field: field.label });
    }
    return field.placeholder;
  }
  if (!field.placeholder || /^please enter/i.test(field.placeholder)) {
    return t("fieldPlaceholder", { field: field.label });
  }
  return field.placeholder;
}

/**
 * ฟิลด์ข้อมูลบัญชีที่ backend กำหนดมา (User ID / Zone ID / เบอร์โทร ฯลฯ)
 *
 * ป้ายชื่อทุกช่องเป็น label จริง ไม่ใช่ placeholder — ข้อความในช่องเป็นเพียงตัวอย่าง
 * เมื่อตรวจไม่ผ่าน ช่องนั้นจะติด aria-invalid + ชี้ไปที่ข้อความ error ด้วย aria-describedby
 * เพื่อให้ screen reader อ่านเหตุผลได้ และกรอบช่องเปลี่ยนสีตามสถานะ
 * ความสูงช่องเป็น 44px บนมือถือ (นิ้วแตะ) และ 32px บนจอใหญ่ (ตามสเกลเดิมของเว็บ)
 */
export function DynamicFields({
  fields,
  values,
  errors,
  onChange,
  disabled = false,
}: {
  fields: SeagmField[];
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
  disabled?: boolean;
}) {
  const t = useTranslations("product");
  const sorted = [...fields].sort((a, b) => a.position - b.position);

  // เมื่อมีฟิลด์ select แต่ยังไม่มีค่า ให้เลือกตัวเลือกแรกเป็นค่าเริ่มต้นอัตโนมัติ
  useEffect(() => {
    sorted.forEach((field) => {
      if (
        field.type === "select" &&
        field.options?.length &&
        (!values[field.name] || !field.options.some((o) => o.value === values[field.name]))
      ) {
        onChange(field.name, field.options[0].value);
      }
    });
  }, [sorted, values, onChange]);

  return (
    <div className="flex flex-col gap-3">
      {sorted.map((field) => {
        const error = errors[field.name];
        const errorId = `field-${field.name}-error`;
        return (
          <div key={field.name} className="flex flex-col gap-1.5">
            <Label htmlFor={`field-${field.name}`}>
              {field.label}
              {field.required ? " *" : ""}
            </Label>
            {field.type === "select" && field.options?.length ? (
              <Select
                value={values[field.name] || (field.options[0]?.value ?? "")}
                onValueChange={(v) => onChange(field.name, v)}
                disabled={disabled}
                required={field.required}
              >
                <SelectTrigger
                  id={`field-${field.name}`}
                  aria-invalid={Boolean(error)}
                  aria-required={field.required || undefined}
                  aria-describedby={error ? errorId : undefined}
                  className="h-11 disabled:opacity-60 lg:h-8"
                >
                  <SelectValue placeholder={disabled ? undefined : thaiPlaceholder(field, t)} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.multiline ? (
              <textarea
                id={`field-${field.name}`}
                className="min-h-[80px] rounded-[10px] border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
                placeholder={thaiPlaceholder(field, t)}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
                required={field.required}
                aria-required={field.required || undefined}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            ) : (
              <Input
                id={`field-${field.name}`}
                value={values[field.name] ?? ""}
                placeholder={disabled ? undefined : thaiPlaceholder(field, t)}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
                required={field.required}
                aria-required={field.required || undefined}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className="num h-11 disabled:opacity-60 lg:h-8"
              />
            )}
            {error ? (
              <p id={errorId} role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
      {disabled ? (
        // ไม่ลด opacity: muted-foreground @70% บน bg-card ตกไป ~3.9:1 (ต่ำกว่า 4.5:1)
        <p className="text-2xs text-muted-foreground">{t("lockedHint")}</p>
      ) : null}
    </div>
  );
}

// Standalone validator (no hooks): returns {fieldName: thaiErrorMessage} for missing required fields.
// messageFor แปลข้อความจาก messages/th.json (product.fieldRequired) — ผู้เรียกส่ง t เข้ามา
export function validateRequired(
  fields: SeagmField[],
  values: Record<string, string>,
  messageFor: (field: SeagmField) => string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.required && !(values[f.name] ?? "").trim()) {
      errors[f.name] = messageFor(f);
    }
  }
  return errors;
}
