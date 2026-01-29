"use client";

import { useReducedMotion } from "@/lib/framer-exports";

export function useAnimations() {
  // Check if the user prefers reduced motion
  const prefersReducedMotion = useReducedMotion();
  
  // Base transitions with consideration for reduced motion
  const getTransition = (type = "default") => {
    if (prefersReducedMotion) {
      return { duration: 0.1 }; // Minimal animation when reduced motion is preferred
    }
    
    switch (type) {
      case "spring":
        return {
          type: "spring",
          stiffness: 300,
          damping: 30
        };
      case "tween":
        return {
          type: "tween",
          ease: "easeInOut",
          duration: 0.4
        };
      default:
        return {
          duration: 0.3,
          ease: "easeInOut"
        };
    }
  };
  
  // Common animation variants
  const fadeIn = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: getTransition()
    }
  };
  
  const slideUp = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: getTransition("spring")
    }
  };
  
  const slideInRight = {
    hidden: { x: 100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: getTransition("spring")
    }
  };
  
  const slideInLeft = {
    hidden: { x: -100, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: getTransition("spring")
    }
  };
  
  const scale = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: getTransition("spring")
    }
  };
  
  // Stagger container for lists
  const staggerContainer = (staggerChildren = 0.1, delayChildren = 0) => ({
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren,
        ...getTransition()
      }
    }
  });
  
  // Interactive animations
  const hoverScale = prefersReducedMotion ? {} : {
    scale: 1.05,
    transition: { duration: 0.2 }
  };
  
  const tapScale = prefersReducedMotion ? {} : {
    scale: 0.95,
    transition: { duration: 0.1 }
  };
  
  // Button animations
  const buttonHover = prefersReducedMotion ? {} : {
    scale: 1.05,
    boxShadow: "0 5px 15px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.2 }
  };
  
  const buttonTap = prefersReducedMotion ? {} : {
    scale: 0.95,
    boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    transition: { duration: 0.1 }
  };
  
  // Shared animation props for cards
  const cardAnimationProps = {
    whileHover: prefersReducedMotion ? {} : {
      y: -5,
      transition: { duration: 0.2 }
    },
    whileTap: prefersReducedMotion ? {} : {
      y: 0,
      transition: { duration: 0.2 }
    },
  };
  
  // Shared animation props for buttons
  const buttonAnimationProps = {
    whileHover: buttonHover,
    whileTap: buttonTap,
    transition: getTransition()
  };
  
  return {
    // Variants
    fadeIn,
    slideUp,
    slideInRight,
    slideInLeft,
    scale,
    staggerContainer,
    
    // Interactive
    hoverScale,
    tapScale,
    buttonHover,
    buttonTap,
    
    // Props
    cardAnimationProps,
    buttonAnimationProps,
    
    // Utils
    getTransition,
    prefersReducedMotion
  };
} 