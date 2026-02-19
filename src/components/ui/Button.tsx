import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-base font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-brutal-yellow text-black border-[3px] border-black shadow-brutal-mobile hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000]",
        primary:
          "bg-brutal-pink text-white border-[3px] border-black shadow-brutal-mobile hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000]",
        secondary:
          "bg-white text-black border-[3px] border-black shadow-brutal-mobile hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000]",
        outline:
          "border-[3px] border-black bg-transparent hover:bg-gray-100 text-black",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-primary underline-offset-4 hover:underline",
        danger:
          "bg-red-500 text-white border-[3px] border-black shadow-brutal-mobile hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_#000]",
      },
      size: {
        default: "h-12 px-6 py-3 w-full sm:w-auto", // Mobile first: h-12, w-full
        sm: "h-10 px-4 text-sm w-auto rounded-md",
        md: "h-12 md:h-10 px-4 md:px-5 text-base md:text-sm rounded-lg",
        lg: "h-14 md:h-12 px-6 text-lg md:text-base rounded-lg w-full sm:w-auto",
        icon: "h-12 w-12 p-0 aspect-square",
        "mobile-full": "w-full h-12 px-4 text-base rounded-lg sm:w-auto",
        full: "w-full h-14 md:h-12 px-6", // Always full width on all screens
      },
      fullWidth: {
        true: "w-full",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      asChild,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-3 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
