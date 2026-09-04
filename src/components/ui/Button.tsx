import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

type AsChildProps = React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode };

const Slot = React.forwardRef<HTMLElement, AsChildProps>(
  function Slot({ children, ...slotProps }, forwardedRef) {
    if (!React.isValidElement(children)) return null;
    const childProps = (children.props ?? {}) as Record<string, unknown>;
    const merged: Record<string, unknown> = { ...slotProps, ...childProps };
    const childClassName =
      typeof childProps.className === "string" ? childProps.className : undefined;
    merged.className = cn(slotProps.className, childClassName);
    if (forwardedRef && !childProps.ref) merged.ref = forwardedRef;
    return React.cloneElement(children, merged);
  },
);

const LoadingSpinner = (
  <svg
    aria-hidden="true"
    className="animate-spin h-4 w-4 text-current"
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
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-site-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-site-bg disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-site-accent text-site-bg font-bold hover:brightness-105 border-t border-t-white/35 border-l border-l-white/15 border-r border-r-black/20 border-b-[3px] border-b-[#b85708] active:border-b active:translate-y-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-100",
        primary:
          "bg-site-accent text-site-bg font-bold hover:brightness-105 border-t border-t-white/35 border-l border-l-white/15 border-r border-r-black/20 border-b-[3px] border-b-[#b85708] active:border-b active:translate-y-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-100",
        arcade:
          "bg-site-accent text-site-bg font-bold hover:brightness-105 border-t border-t-white/35 border-l border-l-white/15 border-r border-r-black/20 border-b-[3px] border-b-[#b85708] active:border-b active:translate-y-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-100",
        secondary:
          "bg-site-raised text-site-text font-semibold border-t border-t-white/10 border-l border-l-white/5 border-r border-r-black/30 border-b-[3px] border-b-[#12151c] hover:bg-site-surface active:border-b active:translate-y-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-100",
        outline:
          "border border-site-border bg-transparent text-site-text hover:bg-site-raised active:translate-y-px transition-colors duration-100",
        ghost:
          "bg-transparent text-site-muted hover:bg-site-raised hover:text-site-text transition-colors",
        link:
          "bg-transparent text-site-accent underline-offset-4 hover:underline px-0 py-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0",
        danger:
          "bg-status-danger text-white font-bold hover:brightness-105 border-t border-t-white/30 border-l border-l-white/15 border-r border-r-black/20 border-b-[3px] border-b-[#a82530] active:border-b active:translate-y-[2px] shadow-[0_2px_4px_rgba(0,0,0,0.3)] transition-all duration-100",
      },
      size: {
        default: "h-11 px-5 rounded-10",
        sm: "h-9 px-3 text-xs rounded-6",
        md: "h-11 px-4 rounded-8",
        lg: "h-12 px-6 text-base rounded-8",
        icon: "h-11 w-11 p-0 rounded-8",
        "mobile-full": "h-11 w-full px-4 rounded-8 sm:w-auto",
        full: "h-12 w-full px-6 rounded-8",
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
  function Button(
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading,
      asChild = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) {
    const classes = cn(
      buttonVariants({ variant, size, fullWidth }),
      isLoading && "cursor-wait",
      className,
    );

    const content = (
      <>
        {isLoading && LoadingSpinner}
        {children}
      </>
    );

    if (asChild) {
      const childProps = React.isValidElement(children)
        ? ((children.props ?? {}) as { children?: React.ReactNode })
        : {};
      // Inject only the child's original children (plus spinner), never the
      // child element itself — cloning the element into its own children
      // previously rendered <a><a>…</a></a> for <Button asChild><Link>.
      const childContent = (
        <>
          {isLoading && LoadingSpinner}
          {childProps.children}
        </>
      );
      return (
        <Slot ref={ref as React.Ref<HTMLElement>} className={classes} {...props}>
          {React.isValidElement(children)
            ? React.cloneElement(children, {
                children: childContent,
              } as Record<string, unknown>)
            : children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={classes}
        disabled={isLoading || disabled}
        {...props}
      >
        {content}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };