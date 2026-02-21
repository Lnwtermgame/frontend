import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full bg-white border-[2px] border-gray-300 px-3 py-2 text-base ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-black focus-visible:ring-0 disabled:cursor-not-allowed disabled:opacity-50 transition-colors",
  {
    variants: {
      size: {
        default: "h-12", // Mobile friendly height
        sm: "h-10",
        lg: "h-14",
      },
      error: {
        true: "border-red-500 focus-visible:border-red-500",
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
  label?: string;
  errorText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      size,
      error,
      label,
      errorText,
      icon,
      iconPosition = "left",
      ...props
    },
    ref,
  ) => {
    const hasError = error || !!errorText;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            className={cn(
              "text-sm font-bold text-gray-700 thai-font block mb-1",
              hasError && "text-red-500",
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && iconPosition === "left" && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ size, error: hasError, className }),
              icon && iconPosition === "left" && "pl-10",
              icon && iconPosition === "right" && "pr-10",
            )}
            ref={ref}
            {...props}
          />
          {icon && iconPosition === "right" && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
        {errorText && (
          <p className="text-sm text-red-500 font-medium thai-font mt-1">
            {errorText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
