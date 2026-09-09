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

export function DynamicFields({
  fields,
  values,
  errors,
  onChange,
}: {
  fields: SeagmField[];
  values: Record<string, string>;
  errors: Record<string, string>;
  onChange: (name: string, value: string) => void;
}) {
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
              >
                <SelectTrigger id={`field-${field.name}`}>
                  <SelectValue placeholder={field.placeholder} />
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
                className="min-h-[80px] rounded-[10px] border bg-transparent px-3 py-2 text-sm"
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(e) => onChange(field.name, e.target.value)}
              />
            ) : (
              <Input
                id={`field-${field.name}`}
                value={values[field.name] ?? ""}
                placeholder={field.placeholder}
                onChange={(e) => onChange(field.name, e.target.value)}
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
