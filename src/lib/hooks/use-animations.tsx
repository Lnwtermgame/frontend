"use client";

import { useReducedMotion } from "@/lib/framer-exports";

export function useAnimations() {
  // Check if the user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();

  // Interactive animations only - no entry animations
  const hoverScale = prefersReducedMotion
    ? {}
    : {
        scale: 1.05,
        transition: { duration: 0.2 },
      };

  const tapScale = prefersReducedMotion
    ? {}
    : {
        scale: 0.95,
        transition: { duration: 0.1 },
      };

  // Button animations
  const buttonHover = prefersReducedMotion
    ? {}
    : {
        scale: 1.05,
        boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.2 },
      };

  const buttonTap = prefersReducedMotion
    ? {}
    : {
        scale: 0.95,
        boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
        transition: { duration: 0.1 },
      };

  // Shared animation props for cards
  const cardAnimationProps = {
    whileHover: prefersReducedMotion
      ? {}
      : {
          y: -5,
          transition: { duration: 0.2 },
        },
    whileTap: prefersReducedMotion
      ? {}
      : {
          y: 0,
          transition: { duration: 0.2 },
        },
  };

  // Shared animation props for buttons
  const buttonAnimationProps = {
    whileHover: buttonHover,
    whileTap: buttonTap,
  };

  return {
    // Interactive only
    hoverScale,
    tapScale,
    buttonHover,
    buttonTap,

    // Props
    cardAnimationProps,
    buttonAnimationProps,

    // Utils
    prefersReducedMotion,
  };
}
