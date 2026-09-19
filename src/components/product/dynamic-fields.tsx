"use client";

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

/* placeholder จาก backend เป็นอังกฤษ ("Please enter User ID") — แปลงเป็นไทยตาม label */
function thaiPlaceholder(field: SeagmField): string | undefined {
  if (field.placeholder && /^please enter/i.test(field.placeholder)) {
    return `กรอก ${field.label}`;
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
                value={values[field.name] ?? ""}
                onValueChange={(v) => onChange(field.name, v)}
                disabled={disabled}
              >
                <SelectTrigger
                  id={`field-${field.name}`}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? errorId : undefined}
                  className="data-[size=default]:h-11 lg:data-[size=default]:h-8"
                >
                  <SelectValue placeholder={disabled ? undefined : thaiPlaceholder(field)} />
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
                placeholder={thaiPlaceholder(field)}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
              />
            ) : (
              <Input
                id={`field-${field.name}`}
                value={values[field.name] ?? ""}
                placeholder={disabled ? undefined : thaiPlaceholder(field)}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
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
        <p className="text-[11px] text-muted-foreground">{t("lockedHint")}</p>
      ) : null}
    </div>
  );
}

// Standalone validator (no hooks): returns {fieldName: thaiErrorMessage} for missing required fields.
export function validateRequired(
  fields: SeagmField[],
  values: Record<string, string>,
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.required && !(values[f.name] ?? "").trim()) {
      errors[f.name] = `กรุณากรอก${f.label}`;
    }
  }
  return errors;
}
