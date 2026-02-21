"use client";

import React, { ReactNode } from "react";
import { motion, useReducedMotion } from "@/lib/framer-exports";
import type { HTMLMotionProps } from "framer-motion";

import { buttonAnimation, cardHoverAnimation } from "@/lib/framer-exports";

type HoverEffectType = "button" | "card" | "lift" | "glow" | "scale";

interface HoverAnimationProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children:
    | ReactNode
    | ((props: { isHovered: boolean; disabled: boolean }) => ReactNode);
  type?: HoverEffectType;
  className?: string;
  hoverClass?: string;
  disabled?: boolean;
}

export default function HoverAnimation({
  children,
  type = "button",
  className,
  hoverClass,
  disabled = false,
  ...props
}: HoverAnimationProps) {
  const prefersReducedMotion = useReducedMotion();

  // Get the appropriate variants based on the hover type
  const getVariants = () => {
    if (disabled || prefersReducedMotion) {
      // No animation if disabled or reduced motion preference
      return {};
    }

    switch (type) {
      case "button":
        return buttonAnimation;
      case "card":
        return cardHoverAnimation;
      case "lift":
        return {
          rest: { y: 0, transition: { duration: 0.2 } },
          hover: { y: -5, transition: { duration: 0.2 } },
        };
      case "glow":
        return {
          rest: {
            boxShadow: "0 0 0px rgba(255, 255, 255, 0)",
            transition: { duration: 0.2 },
          },
          hover: {
            boxShadow: "0 0 20px rgba(255, 255, 255, 0.3)",
            transition: { duration: 0.2 },
          },
        };
      case "scale":
        return {
          rest: { scale: 1, transition: { duration: 0.2 } },
          hover: { scale: 1.05, transition: { duration: 0.2 } },
        };
      default:
        return buttonAnimation;
    }
  };

  return (
    <motion.div
      className={`${className} ${disabled ? "opacity-70 cursor-not-allowed" : ""}`}
      initial="rest"
      whileHover={disabled ? undefined : "hover"}
      whileTap={disabled ? undefined : "tap"}
      variants={getVariants() as any}
      {...props}
    >
      {typeof children === "function"
        ? children({ isHovered: false, disabled }) // You could use a state for isHovered if needed
        : children}
    </motion.div>
  );
}

// Export a version specifically for buttons
interface AnimatedButtonProps extends Omit<HoverAnimationProps, "type"> {
  onClick?: () => void;
}

export function AnimatedButton({
  children,
  className,
  disabled,
  onClick,
  ...props
}: AnimatedButtonProps) {
  return (
    <HoverAnimation
      type="button"
      className={`${className} inline-flex items-center justify-center`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </HoverAnimation>
  );
}

// Export a version specifically for cards
interface AnimatedCardProps extends Omit<HoverAnimationProps, "type"> {
  onClick?: () => void;
}

export function AnimatedCard({
  children,
  className,
  disabled,
  onClick,
  ...props
}: AnimatedCardProps) {
  return (
    <HoverAnimation
      type="card"
      className={`${className}`}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </HoverAnimation>
  );
}
