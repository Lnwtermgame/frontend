"use client";

import React from 'react';
import { Ticket, X, Copy, Check } from 'lucide-react';
import { motion } from '@/lib/framer-exports';

export interface CouponBadgeProps {
  code: string;
  discount: {
    type: 'percentage' | 'fixed';
    value: number;
    maxAmount?: number;
  };
  onRemove?: () => void;
  showCopy?: boolean;
  showRemove?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'outline';
}

export function CouponBadge({ 
  code, 
  discount, 
  onRemove, 
  showCopy = false,
  showRemove = true,
  className = '',
  size = 'md',
  variant = 'default'
}: CouponBadgeProps) {
  const [copied, setCopied] = React.useState(false);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'py-1.5 px-2 text-xs',
    md: 'py-2 px-3 text-sm',
    lg: 'py-2.5 px-4 text-base'
  }[size];
  
  // Variant classes
  const variantClasses = {
    default: 'bg-gradient-to-r from-mali-blue/20 to-mali-purple/20 border border-mali-blue/30',
    success: 'bg-gradient-to-r from-emerald-600/20 to-emerald-800/20 border border-emerald-500/30',
    outline: 'bg-transparent border border-mali-blue/30'
  }[variant];
  
  const discountText = discount.type === 'percentage' 
    ? `${discount.value}%` 
    : `$${discount.value.toFixed(2)}`;
  
  const maxAmountText = discount.maxAmount
    ? ` (max $${discount.maxAmount.toFixed(2)})`
    : '';

  return (
    <motion.div 
      className={`rounded-lg ${sizeClasses} ${variantClasses} flex items-center justify-between ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center">
        <div className={`
          ${size === 'sm' ? 'h-5 w-5 mr-2' : size === 'lg' ? 'h-8 w-8 mr-3' : 'h-6 w-6 mr-2.5'} 
          rounded-full bg-mali-blue/30 flex items-center justify-center
        `}>
          <Ticket className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'} text-mali-blue-light`} />
        </div>
        <div>
          <div className="text-white font-medium">{code}</div>
          <div className={`${size === 'sm' ? 'text-xs' : 'text-xs'} text-mali-text-secondary`}>
            {discountText} off{maxAmountText}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {showCopy && (
          <button
            onClick={copyToClipboard}
            className="p-1.5 hover:bg-mali-blue/20 rounded-full"
            aria-label="Copy coupon code"
          >
            {copied ? (
              <Check className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-mali-green`} />
            ) : (
              <Copy className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-mali-text-secondary`} />
            )}
          </button>
        )}
        
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-mali-blue/20 rounded-full"
            aria-label="Remove coupon"
          >
            <X className={`${size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-mali-text-secondary`} />
          </button>
        )}
      </div>
    </motion.div>
  );
} 