import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full bg-site-surface border border-site-border rounded-6 px-3 text-sm text-site-text ring-offset-site-bg placeholder:text-site-dim focus-visible:outline-none focus-visible:border-site-accent focus-visible:ring-2 focus-visible:ring-site-accent/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      size: {
        default: "h-11",
        sm: "h-9",
        lg: "h-12",
      },
      error: {
        true: "border-status-danger focus-visible:border-status-danger focus-visible:ring-status-danger/20",
        false: "",
      },
    },
    defaultVariants: {
      size: "default",
      error: false,
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  label?: React.ReactNode;
  errorText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      type,
      size,
      error,
      label,
      errorText,
      icon,
      iconPosition = "left",
      id,
      ...props
    },
    ref,
  ) {
    const hasError = error || !!errorText;
    const reactId = React.useId();
    const inputId = id ?? `input-${reactId}`;
    const labelId = `${inputId}-label`;
    const describedBy = hasError && errorText ? `${inputId}-error` : undefined;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            id={labelId}
            htmlFor={inputId}
            className={cn(
              "text-sm font-medium text-site-text block",
              hasError && "text-status-danger",
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-site-dim">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            aria-invalid={hasError || undefined}
            aria-describedby={describedBy}
            aria-labelledby={label ? labelId : undefined}
            className={cn(
              inputVariants({ size, error: hasError }),
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
              className,
            )}
            ref={ref}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-site-dim">
              {icon}
            </div>
          )}
        </div>
        {errorText && (
          <p
            id={`${inputId}-error`}
            role={hasError ? "alert" : undefined}
            className="text-sm text-status-danger"
          >
            {errorText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };