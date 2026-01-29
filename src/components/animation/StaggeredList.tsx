'use client';

import React, { ReactNode, Children } from 'react';
import { motion } from "@/lib/framer-exports";
import { useInView } from 'react-intersection-observer';
import type { HTMLMotionProps } from 'framer-motion';

import { staggerListAnimation, staggerItemAnimation } from '@/lib/framer-exports';

interface StaggeredListProps extends HTMLMotionProps<"ul"> {
  children: ReactNode;
  staggerDelay?: number;
  childClassName?: string;
  threshold?: number;
  once?: boolean;
}

export default function StaggeredList({
  children,
  staggerDelay = 0.05,
  className,
  childClassName = '',
  threshold = 0.1,
  once = true,
  ...props
}: StaggeredListProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
  });

  // Create custom variants with specified stagger delay
  const customListVariants = {
    hidden: staggerListAnimation.hidden,
    visible: {
      ...staggerListAnimation.visible,
      transition: {
        ...staggerListAnimation.visible.transition,
        staggerChildren: staggerDelay,
      }
    }
  };

  return (
    <motion.ul
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={customListVariants}
      className={className}
      {...props}
    >
      {Children.map(children, (child, index) => (
        <motion.li
          key={index}
          variants={staggerItemAnimation}
          className={childClassName}
        >
          {child}
        </motion.li>
      ))}
    </motion.ul>
  );
}

// Grid version for staggered grid layouts
interface StaggeredGridProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  staggerDelay?: number;
  childClassName?: string;
  threshold?: number;
  once?: boolean;
}

export function StaggeredGrid({
  children,
  staggerDelay = 0.05,
  className,
  childClassName = '',
  threshold = 0.1,
  once = true,
  ...props
}: StaggeredGridProps) {
  const { ref, inView } = useInView({
    threshold,
    triggerOnce: once,
  });

  // Create custom variants with specified stagger delay
  const customGridVariants = {
    hidden: staggerListAnimation.hidden,
    visible: {
      ...staggerListAnimation.visible,
      transition: {
        ...staggerListAnimation.visible.transition,
        staggerChildren: staggerDelay,
        delayChildren: 0.1, // Small initial delay before starting stagger
      }
    }
  };

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={customGridVariants}
      className={className}
      {...props}
    >
      {Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={staggerItemAnimation}
          className={childClassName}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
} 
