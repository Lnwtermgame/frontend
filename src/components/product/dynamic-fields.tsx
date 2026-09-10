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
        return (
          <div key={field.name} className="flex flex-col gap-1">
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
                <SelectTrigger id={`field-${field.name}`}>
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
                className="min-h-[80px] rounded-[10px] border bg-transparent px-3 py-2 text-sm disabled:opacity-60"
                placeholder={thaiPlaceholder(field)}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
              />
            ) : (
              <Input
                id={`field-${field.name}`}
                value={values[field.name] ?? ""}
                placeholder={disabled ? undefined : thaiPlaceholder(field)}
                onChange={(e) => onChange(field.name, e.target.value)}
                disabled={disabled}
                className="num disabled:opacity-60"
              />
            )}
            {error ? (
              <p role="alert" className="text-xs text-destructive">
                {error}
              </p>
            ) : null}
          </div>
        );
      })}
      {disabled ? (
        <p className="text-[11px] text-muted-foreground/70">{t("lockedHint")}</p>
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
