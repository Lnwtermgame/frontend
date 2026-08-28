"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const adminHeaderButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg font-bold text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary:
          "bg-site-accent text-site-bg border border-site-accent/50 hover:bg-site-accent-hover",
        secondary:
          "bg-site-surface border border-site-border text-site-text hover:bg-site-raised font-medium",
        muted:
          "border border-site-border text-site-muted hover:bg-site-raised hover:text-site-text font-medium",
        accentSoft:
          "bg-site-accent/10 border border-site-accent/20 text-site-accent hover:bg-site-accent/20 hover:border-site-accent/30",
      },
      size: {
        default: "px-4 py-2",
        sm: "px-3 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "default",
    },
  },
);

export interface AdminHeaderButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof adminHeaderButtonVariants> {}

export const AdminHeaderButton = React.forwardRef<
  HTMLButtonElement,
  AdminHeaderButtonProps
>(({ className, variant, size, type = "button", ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(adminHeaderButtonVariants({ variant, size }), className)}
    {...props}
  />
));
AdminHeaderButton.displayName = "AdminHeaderButton";