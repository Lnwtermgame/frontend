'use client';

import React, { ReactNode } from 'react';
import { 
  motion, 
  useReducedMotion,
} from "@/lib/framer-exports";
import { useInView } from "react-intersection-observer";
import type { MotionProps, Variants, Variant } from "framer-motion";

import {
  fadeAnimation,
  slideUpAnimation,
  slideDownAnimation,
  slideLeftAnimation,
  slideRightAnimation,
  scaleAnimation,
  scaleUpAnimation,
} from '@/lib/framer-exports';

type AnimationType = 
  | 'fade' 
  | 'slideUp' 
  | 'slideDown' 
  | 'slideLeft' 
  | 'slideRight' 
  | 'scale' 
  | 'scaleUp'
  | 'none';

interface AnimatedElementProps extends Omit<MotionProps, 'variants'> {
  children: ReactNode;
  type?: AnimationType;
  delay?: number;
  duration?: number;
  threshold?: number;
  once?: boolean;
  className?: string;
  viewport?: { once?: boolean; margin?: string };
  customVariants?: Variants;
}

export default function AnimatedElement({
  children,
  type = 'fade',
  delay = 0,
  duration,
  threshold = 0.1,
  once = true,
  className,
  viewport,
  customVariants,
  ...motionProps
}: AnimatedElementProps) {
  const prefersReducedMotion = useReducedMotion();
  
  // Use react-intersection-observer hook
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
    ...viewport
  });
  
  // If user prefers reduced motion, use fade or no animation
  const effectiveType = prefersReducedMotion ? (type === 'none' ? 'none' : 'fade') : type;

  // Select the appropriate animation variant based on type
  const getVariants = (): Variants => {
    if (customVariants) return customVariants;
    
    switch (effectiveType) {
      case 'fade':
        return fadeAnimation;
      case 'slideUp':
        return slideUpAnimation;
      case 'slideDown':
        return slideDownAnimation;
      case 'slideLeft':
        return slideLeftAnimation;
      case 'slideRight':
        return slideRightAnimation;
      case 'scale':
        return scaleAnimation;
      case 'scaleUp':
        return scaleUpAnimation;
      case 'none':
      default:
        return { visible: {}, hidden: {} };
    }
  };

  // Apply delay and custom duration to selected variant
  const animationVariants = React.useMemo(() => {
    const variants = getVariants();
    const visibleVariant = variants.visible as any; // Type cast to avoid TS errors with transition
    
    return {
      hidden: { ...variants.hidden },
      visible: { 
        ...variants.visible,
        transition: {
          ...(visibleVariant?.transition || {}),
          delay,
          ...(duration ? { duration } : {}),
        },
      }
    };
  }, [delay, duration, effectiveType, customVariants]);

  if (type === 'none') {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      exit="hidden"
      variants={animationVariants}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
} 
