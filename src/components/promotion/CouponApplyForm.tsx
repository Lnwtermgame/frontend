"use client";

import { useState } from 'react';
import { Ticket, X, AlertCircle, Check, Percent } from 'lucide-react';
import { motion, AnimatePresence } from '@/lib/framer-exports';

export interface CouponApplyFormProps {
  onApply: (code: string) => Promise<{
    success: boolean;
    message: string;
    discount?: {
      type: 'percentage' | 'fixed';
      value: number;
      maxAmount?: number;
    };
  }>;
  className?: string;
}

export function CouponApplyForm({ onApply, className = '' }: CouponApplyFormProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: {
      type: 'percentage' | 'fixed';
      value: number;
      maxAmount?: number;
    };
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // This will be implemented by backend
      // For now, we'll just show an example of how it would work
      const result = await onApply(couponCode.trim());
      
      if (result.success && result.discount) {
        setAppliedCoupon({
          code: couponCode.trim(),
          discount: result.discount
        });
        setCouponCode('');
      } else {
        setError(result.message || 'Invalid coupon code');
      }
    } catch (err) {
      console.error('Error applying coupon:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const clearAppliedCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Applied Coupon */}
      <AnimatePresence>
        {appliedCoupon && (
          <motion.div 
            className="bg-gradient-to-r from-mali-blue/20 to-mali-purple/20 border border-mali-blue/30 rounded-lg p-3 flex justify-between items-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-mali-blue/30 flex items-center justify-center mr-3">
                <Ticket className="h-4 w-4 text-mali-blue-light" />
              </div>
              <div>
                <div className="text-white text-sm font-medium">{appliedCoupon.code}</div>
                <div className="text-xs text-mali-text-secondary">
                  {appliedCoupon.discount.type === 'percentage' 
                    ? `${appliedCoupon.discount.value}% off`
                    : `$${appliedCoupon.discount.value.toFixed(2)} off`
                  }
                  {appliedCoupon.discount.maxAmount && 
                    ` (max $${appliedCoupon.discount.maxAmount.toFixed(2)})`}
                </div>
              </div>
            </div>
            <button 
              onClick={clearAppliedCoupon}
              className="p-1.5 hover:bg-mali-blue/20 rounded-full"
            >
              <X className="h-4 w-4 text-mali-text-secondary" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Coupon Form */}
      {!appliedCoupon && (
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Ticket className="h-5 w-5 text-mali-blue/70" />
            </div>
            <input
              type="text"
              placeholder="Enter coupon code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
              className={`flex-1 bg-mali-navy/50 border ${error ? 'border-red-400' : 'border-mali-blue/20'} pl-10 pr-3 py-2.5 rounded-l-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-mali-blue focus:border-mali-blue`}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-button-gradient text-white px-4 py-2.5 rounded-r-lg flex items-center justify-center shadow-button-glow transition-opacity ${isSubmitting ? 'opacity-70' : 'hover:opacity-90'}`}
            >
              {isSubmitting ? 'Applying...' : 'Apply'}
            </button>
          </div>
          
          {error && (
            <motion.div 
              className="text-xs text-red-400 flex items-center mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <AlertCircle className="h-3 w-3 mr-1" />
              {error}
            </motion.div>
          )}
        </form>
      )}
    </div>
  );
} 