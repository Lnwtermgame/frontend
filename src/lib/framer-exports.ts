"use client";

// Re-export specific named exports from framer-motion
import {
  motion,
  AnimatePresence,
  useReducedMotion,
  Variants,
} from "framer-motion";

// Card hover animations
export const cardHoverAnimation = {
  rest: {
    scale: 1,
    boxShadow: "0 0 0px rgba(0, 0, 0, 0)",
  },
  hover: {
    scale: 1.02,
    y: -5,
    boxShadow: "0 10px 20px rgba(0, 0, 0, 0.15)",
    transition: { duration: 0.2 },
  },
};

// Button animations
export const buttonAnimation = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.97 },
};

// Re-export essential components only
export {
  motion,
  AnimatePresence,
  useReducedMotion,
};
