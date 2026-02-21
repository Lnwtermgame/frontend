"use client";

// Re-export specific named exports from framer-motion
import {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useAnimate,
  useMotionValue,
  useInView,
  useAnimation,
  useReducedMotion,
  animate,
  m as motionShorthand,
  LazyMotion,
  domAnimation,
  domMax,
  MotionConfig,
  Variants,
} from "framer-motion";

// Standard transitions
export const transitions = {
  ease: {
    duration: 0.4,
    ease: [0.25, 0.1, 0.25, 1] as const, // Smooth cubic-bezier easing
  },
  spring: {
    type: "spring" as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
  },
  bounce: {
    type: "spring" as const,
    stiffness: 300,
    damping: 10,
  },
  stagger: (staggerTime = 0.05) => ({
    staggerChildren: staggerTime,
  }),
};

// Basic animation variants
export const fadeAnimation = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transitions.ease,
  },
};

export const slideUpAnimation = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      ...transitions.spring,
      opacity: { duration: 0.4 },
    },
  },
};

export const slideDownAnimation = {
  hidden: { y: -30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      ...transitions.spring,
      opacity: { duration: 0.4 },
    },
  },
};

export const slideLeftAnimation = {
  hidden: { x: 30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      ...transitions.spring,
      opacity: { duration: 0.4 },
    },
  },
};

export const slideRightAnimation = {
  hidden: { x: -30, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      ...transitions.spring,
      opacity: { duration: 0.4 },
    },
  },
};

// Scale animations
export const scaleAnimation = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: transitions.spring,
  },
};

export const scaleUpAnimation = {
  hidden: { scale: 0.8, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      ...transitions.spring,
      opacity: { duration: 0.4 },
    },
  },
};

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
    transition: transitions.spring,
  },
};

// Button animations
export const buttonAnimation = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.97 },
};

// Stagger children animations for lists
export const staggerListAnimation = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerItemAnimation = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: transitions.spring,
  },
};

// Page transition animation
export const pageTransition = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.2,
      ease: [0.25, 0.1, 0.25, 1] as const,
    },
  },
};

// Utility function to combine animations with custom props
export const combineAnimations = (
  baseAnimation: Variants,
  customProps: any,
): Variants => {
  const result: Variants = {};

  for (const key in baseAnimation) {
    result[key] = {
      ...baseAnimation[key],
      ...customProps[key],
    };
  }

  return result;
};

// Re-export everything
export {
  motion,
  AnimatePresence,
  useScroll,
  useSpring,
  useTransform,
  useAnimate,
  useMotionValue,
  useInView,
  useAnimation,
  useReducedMotion,
  animate,
  motionShorthand,
  LazyMotion,
  domAnimation,
  domMax,
  MotionConfig,
};
