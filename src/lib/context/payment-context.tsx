"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  type: 'qr' | 'card' | 'bank' | 'wallet' | 'crypto';
  processorId: string;
  isActive: boolean;
  fee?: number;
  minAmount?: number;
  maxAmount?: number;
  exchangeRate?: number; // For multi-currency
  currency?: string;
}

export interface SavedPaymentMethod {
  id: string;
  methodId: string;
  nickname: string;
  lastUsed: string;
  maskedNumber?: string; // For cards: "•••• 1234"
  icon?: string;
}

type PaymentContextType = {
  availablePaymentMethods: PaymentMethod[];
  savedPaymentMethods: SavedPaymentMethod[];
  selectedPaymentMethod: PaymentMethod | null;
  setSelectedPaymentMethod: (method: PaymentMethod | null) => void;
  addSavedPaymentMethod: (method: Omit<SavedPaymentMethod, 'id'>) => void;
  removeSavedPaymentMethod: (id: string) => void;
  isProcessing: boolean;
  processingError: string | null;
  processPayment: (amount: number, currency: string) => Promise<{ success: boolean, transactionId?: string, error?: string }>;
  exchangeRates: Record<string, number>;
};

export const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  // Mock payment methods that would typically come from an API
  const [availablePaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'qr-promptpay',
      name: 'PromptPay QR',
      icon: '/images/payment/promptpay.svg',
      type: 'qr',
      processorId: 'promptpay',
      isActive: true,
      fee: 0
    },
    {
      id: 'credit-card',
      name: 'Credit / Debit Card',
      icon: '/images/payment/creditcard.svg',
      type: 'card',
      processorId: 'stripe',
      isActive: true,
      fee: 2.5
    },
    {
      id: 'wallet-true',
      name: 'True Money Wallet',
      icon: '/images/payment/truemoney.svg',
      type: 'wallet',
      processorId: 'truemoney',
      isActive: true,
      fee: 1.5
    },
    {
      id: 'wallet-shopee',
      name: 'ShopeePay',
      icon: '/images/payment/shopeepay.svg',
      type: 'wallet',
      processorId: 'shopee',
      isActive: true,
      fee: 1.5
    },
    {
      id: 'bank-transfer',
      name: 'Internet Banking',
      icon: '/images/payment/banking.svg',
      type: 'bank',
      processorId: 'gbprimepay',
      isActive: true,
      fee: 0
    },
    {
      id: 'crypto-usdt',
      name: 'USDT',
      icon: '/images/payment/usdt.svg',
      type: 'crypto',
      processorId: 'binance',
      isActive: true,
      fee: 1,
      exchangeRate: 35.2,
      currency: 'USDT'
    }
  ]);

  // Saved payment methods (stored in localStorage)
  const [savedPaymentMethods, setSavedPaymentMethods] = useLocalStorage<SavedPaymentMethod[]>('mali-gamepass-payment-methods', []);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  // Mock exchange rates for multi-currency support
  const [exchangeRates] = useState<Record<string, number>>({
    'USD': 35.5,
    'EUR': 38.2,
    'SGD': 26.3,
    'JPY': 0.24,
    'KRW': 0.026,
    'USDT': 35.2
  });

  const addSavedPaymentMethod = (method: Omit<SavedPaymentMethod, 'id'>) => {
    const newMethod = {
      ...method,
      id: Date.now().toString()
    };
    
    setSavedPaymentMethods(prev => [newMethod, ...prev]);
  };

  const removeSavedPaymentMethod = (id: string) => {
    setSavedPaymentMethods(prev => prev.filter(method => method.id !== id));
  };

  // Mock payment processing function
  const processPayment = async (amount: number, currency: string) => {
    if (!selectedPaymentMethod) {
      return { success: false, error: 'No payment method selected' };
    }

    setIsProcessing(true);
    setProcessingError(null);
    
    try {
      // In a real app, you would integrate with payment gateways here
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API delay
      
      // Simulate success (with 90% success rate)
      const isSuccess = Math.random() > 0.1;
      
      if (isSuccess) {
        return { 
          success: true,
          transactionId: `TXN-${Date.now()}`
        };
      } else {
        throw new Error('Payment processing failed. Please try again.');
      }
    } catch (error) {
      setProcessingError(error instanceof Error ? error.message : 'Unknown error occurred');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <PaymentContext.Provider
      value={{
        availablePaymentMethods,
        savedPaymentMethods,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        addSavedPaymentMethod,
        removeSavedPaymentMethod,
        isProcessing,
        processingError,
        processPayment,
        exchangeRates
      }}
    >
      {children}
    </PaymentContext.Provider>
  );
}

// Custom hook to use the payment context
export function usePayment() {
  const context = useContext(PaymentContext);
  if (context === undefined) {
    throw new Error('usePayment must be used within a PaymentProvider');
  }
  return context;
} 
