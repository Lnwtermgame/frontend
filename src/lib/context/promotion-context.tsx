"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { useAuth } from '@/lib/context/auth-context';

export interface Promotion {
  id: string;
  title: string;
  description: string;
  type: 'flash_sale' | 'cashback' | 'discount' | 'bundle' | 'referral';
  startDate: string;
  endDate: string;
  isActive: boolean;
  bannerImage?: string;
  terms?: string;
  discountType?: 'percentage' | 'fixed_amount';
  discountValue?: number;
  minPurchase?: number;
  maxDiscount?: number;
  productIds?: string[];
  categoryIds?: string[];
  limitPerUser?: number;
  usageCount?: number;
  code?: string;
}

export interface UserPromotion {
  id: string;
  userId: string;
  promotionId: string;
  claimed: boolean;
  claimedAt?: string;
  usageCount: number;
  lastUsed?: string;
  cashbackAmount?: number;
  referralCount?: number;
}

export interface Cashback {
  id: string;
  userId: string;
  amount: number;
  status: 'pending' | 'available' | 'claimed' | 'expired';
  source: 'promotion' | 'referral' | 'loyalty';
  sourceId: string;
  expiryDate: string;
  createdAt: string;
}

export interface Referral {
  id: string;
  userId: string;
  referralCode: string;
  referredUsers: string[];
  totalRewards: number;
  createdAt: string;
}

type PromotionContextType = {
  promotions: Promotion[];
  userPromotions: UserPromotion[];
  cashbacks: Cashback[];
  referral: Referral | null;
  // Flash sales and special events
  getActivePromotions: () => Promotion[];
  getPromotionById: (id: string) => Promotion | undefined;
  claimPromotion: (promotionId: string) => Promise<boolean>;
  applyPromotion: (promotionId: string, amount: number) => Promise<{ success: boolean; discount: number }>;
  // Cashback campaigns
  getTotalCashbackBalance: () => number;
  getAvailableCashback: () => Cashback[];
  useCashback: (amount: number) => Promise<boolean>;
  // Referral program
  getReferralCode: () => string;
  getReferralStats: () => { totalReferred: number; totalRewards: number };
  generateReferralLink: () => string;
  // General state
  isLoading: boolean;
  error: string | null;
};

export const PromotionContext = createContext<PromotionContextType | undefined>(undefined);

export function PromotionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  
  // Mock promotions for demo purposes
  const [promotions, setPromotions] = useLocalStorage<Promotion[]>('mali-gamepass-promotions', [
    {
      id: 'promo-001',
      title: 'Flash Sale: 30% Off PUBG Mobile UC',
      description: 'Get 30% off all PUBG Mobile UC purchases for the next 24 hours!',
      type: 'flash_sale',
      startDate: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      endDate: new Date(Date.now() + 86400000).toISOString(),  // 24 hours from now
      isActive: true,
      bannerImage: 'https://placehold.co/1200x300/003366/ffffff?text=PUBG+Flash+Sale',
      discountType: 'percentage',
      discountValue: 30,
      minPurchase: 0,
      productIds: ['pubg-60-uc', 'pubg-300-uc', 'pubg-600-uc', 'pubg-1500-uc'],
      limitPerUser: 1
    },
    {
      id: 'promo-002',
      title: '10% Cashback on Steam Wallet',
      description: 'Receive 10% cashback on all Steam Wallet purchases',
      type: 'cashback',
      startDate: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      endDate: new Date(Date.now() + 604800000).toISOString(),  // 7 days from now
      isActive: true,
      bannerImage: 'https://placehold.co/1200x300/000000/ffffff?text=Steam+Cashback',
      discountType: 'percentage',
      discountValue: 10,
      minPurchase: 10,
      maxDiscount: 50,
      categoryIds: ['steam', 'gift-cards'],
      terms: 'Cashback will be credited to your account within 24 hours of purchase. Maximum cashback amount is $50.'
    },
    {
      id: 'promo-003',
      title: 'Refer a Friend, Get $5',
      description: 'Refer a friend and both get $5 credit when they make their first purchase',
      type: 'referral',
      startDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
      endDate: new Date(Date.now() + 2592000000).toISOString(),  // 30 days from now
      isActive: true,
      bannerImage: 'https://placehold.co/1200x300/6633cc/ffffff?text=Refer+A+Friend',
      discountType: 'fixed_amount',
      discountValue: 5,
      terms: 'Your friend must make a purchase of at least $20 for both of you to receive the reward.'
    },
    {
      id: 'promo-004',
      title: 'Weekend Special: Free Shipping',
      description: 'Free shipping on all physical merchandise this weekend',
      type: 'discount',
      startDate: new Date(Date.now() + 86400000).toISOString(), // Starts tomorrow
      endDate: new Date(Date.now() + 259200000).toISOString(),  // 3 days from now
      isActive: false,
      bannerImage: 'https://placehold.co/1200x300/990000/ffffff?text=Free+Shipping',
      discountType: 'percentage',
      discountValue: 100,
      categoryIds: ['merchandise', 'physical-goods'],
      code: 'WEEKEND'
    }
  ]);
  
  // Mock user-specific promotions
  const [userPromotions, setUserPromotions] = useLocalStorage<UserPromotion[]>('mali-gamepass-user-promotions', [
    {
      id: 'user-promo-001',
      userId: userId,
      promotionId: 'promo-001',
      claimed: false,
      usageCount: 0
    },
    {
      id: 'user-promo-002',
      userId: userId,
      promotionId: 'promo-002',
      claimed: true,
      claimedAt: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      usageCount: 1,
      lastUsed: new Date(Date.now() - 43200000).toISOString()
    }
  ]);
  
  // Mock cashbacks
  const [cashbacks, setCashbacks] = useLocalStorage<Cashback[]>('mali-gamepass-cashbacks', [
    {
      id: 'cashback-001',
      userId: userId,
      amount: 15.75,
      status: 'available',
      source: 'promotion',
      sourceId: 'promo-002',
      expiryDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
    },
    {
      id: 'cashback-002',
      userId: userId,
      amount: 5,
      status: 'claimed',
      source: 'referral',
      sourceId: 'referral-001',
      expiryDate: new Date(Date.now() + 2592000000).toISOString(), // 30 days from now
      createdAt: new Date(Date.now() - 604800000).toISOString() // 7 days ago
    }
  ]);
  
  // Mock referral data
  const [referral, setReferral] = useLocalStorage<Referral | null>('mali-gamepass-referral', {
    id: 'ref-001',
    userId: userId,
    referralCode: 'FRIEND25',
    referredUsers: ['user-123', 'user-456'],
    totalRewards: 10,
    createdAt: new Date(Date.now() - 2592000000).toISOString() // 30 days ago
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get active promotions
  const getActivePromotions = (): Promotion[] => {
    const now = new Date().toISOString();
    return promotions.filter(promo => 
      promo.isActive && 
      promo.startDate <= now && 
      promo.endDate >= now
    );
  };
  
  // Get promotion by ID
  const getPromotionById = (id: string): Promotion | undefined => {
    return promotions.find(promo => promo.id === id);
  };
  
  // Claim a promotion
  const claimPromotion = async (promotionId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Validate user and promotion
      const promotion = getPromotionById(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }
      
      const now = new Date().toISOString();
      if (!promotion.isActive || promotion.startDate > now || promotion.endDate < now) {
        throw new Error('Promotion is not active');
      }
      
      // Check if user already claimed
      const existingClaim = userPromotions.find(up => 
        up.userId === userId && 
        up.promotionId === promotionId
      );
      
      if (existingClaim && existingClaim.claimed) {
        if (promotion.limitPerUser && existingClaim.usageCount >= promotion.limitPerUser) {
          throw new Error('You have already reached the usage limit for this promotion');
        }
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const timestamp = new Date().toISOString();
      
      if (existingClaim) {
        // Update existing claim
        setUserPromotions(prev => prev.map(up => {
          if (up.id === existingClaim.id) {
            return {
              ...up,
              claimed: true,
              claimedAt: up.claimedAt || timestamp
            };
          }
          return up;
        }));
      } else {
        // Create new claim
        const newUserPromotion: UserPromotion = {
          id: `user-promo-${Date.now()}`,
          userId,
          promotionId,
          claimed: true,
          claimedAt: timestamp,
          usageCount: 0
        };
        
        setUserPromotions(prev => [...prev, newUserPromotion]);
      }
      
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to claim promotion');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Apply promotion discount
  const applyPromotion = async (
    promotionId: string, 
    amount: number
  ): Promise<{ success: boolean; discount: number }> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Find promotion and user's claim
      const promotion = getPromotionById(promotionId);
      if (!promotion) {
        throw new Error('Promotion not found');
      }
      
      const userPromotion = userPromotions.find(up => 
        up.userId === userId && 
        up.promotionId === promotionId && 
        up.claimed
      );
      
      if (!userPromotion) {
        throw new Error('Promotion not claimed');
      }
      
      const now = new Date().toISOString();
      if (!promotion.isActive || promotion.startDate > now || promotion.endDate < now) {
        throw new Error('Promotion is not active');
      }
      
      if (promotion.limitPerUser && userPromotion.usageCount >= promotion.limitPerUser) {
        throw new Error('Usage limit reached');
      }
      
      if (promotion.minPurchase && amount < promotion.minPurchase) {
        throw new Error(`Minimum purchase amount is ${promotion.minPurchase}`);
      }
      
      // Calculate discount
      let discount = 0;
      
      if (promotion.discountType === 'percentage') {
        discount = (amount * promotion.discountValue!) / 100;
        if (promotion.maxDiscount && discount > promotion.maxDiscount) {
          discount = promotion.maxDiscount;
        }
      } else if (promotion.discountType === 'fixed_amount') {
        discount = promotion.discountValue!;
      }
      
      // In case of cashback, create a cashback entry
      if (promotion.type === 'cashback') {
        const newCashback: Cashback = {
          id: `cashback-${Date.now()}`,
          userId,
          amount: discount,
          status: 'pending',
          source: 'promotion',
          sourceId: promotionId,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          createdAt: now
        };
        
        setCashbacks(prev => [...prev, newCashback]);
      }
      
      // Update usage count
      setUserPromotions(prev => prev.map(up => {
        if (up.id === userPromotion.id) {
          return {
            ...up,
            usageCount: up.usageCount + 1,
            lastUsed: now
          };
        }
        return up;
      }));
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true, discount };
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to apply promotion');
      return { success: false, discount: 0 };
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get total cashback balance
  const getTotalCashbackBalance = (): number => {
    return cashbacks
      .filter(cb => cb.userId === userId && cb.status === 'available')
      .reduce((total, cb) => total + cb.amount, 0);
  };
  
  // Get available cashback
  const getAvailableCashback = (): Cashback[] => {
    return cashbacks.filter(cb => 
      cb.userId === userId && 
      cb.status === 'available' &&
      new Date(cb.expiryDate) > new Date()
    );
  };
  
  // Use cashback
  const useCashback = async (amount: number): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const availableCashbacks = getAvailableCashback();
      const totalAvailable = availableCashbacks.reduce((total, cb) => total + cb.amount, 0);
      
      if (amount > totalAvailable) {
        throw new Error(`Insufficient cashback balance. Available: ${totalAvailable}`);
      }
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let remainingAmount = amount;
      const updatedCashbacks = [...cashbacks];
      
      // Use cashbacks from oldest to newest until the requested amount is fulfilled
      availableCashbacks.sort((a, b) => 
        new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
      ).forEach(cashback => {
        if (remainingAmount <= 0) return;
        
        const cashbackIndex = updatedCashbacks.findIndex(cb => cb.id === cashback.id);
        
        if (cashback.amount <= remainingAmount) {
          // Use entire cashback
          updatedCashbacks[cashbackIndex] = {
            ...cashback,
            status: 'claimed',
          };
          remainingAmount -= cashback.amount;
        } else {
          // Use partial cashback
          updatedCashbacks[cashbackIndex] = {
            ...cashback,
            amount: cashback.amount - remainingAmount
          };
          remainingAmount = 0;
          
          // Create a "claimed" record for the used portion
          const claimedPortion: Cashback = {
            id: `cashback-${Date.now()}`,
            userId: cashback.userId,
            amount: remainingAmount,
            status: 'claimed',
            source: cashback.source,
            sourceId: cashback.sourceId,
            expiryDate: cashback.expiryDate,
            createdAt: new Date().toISOString()
          };
          updatedCashbacks.push(claimedPortion);
        }
      });
      
      setCashbacks(updatedCashbacks);
      
      return true;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to use cashback');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get referral code
  const getReferralCode = (): string => {
    return referral?.referralCode || '';
  };
  
  // Get referral statistics
  const getReferralStats = () => {
    return {
      totalReferred: referral?.referredUsers.length || 0,
      totalRewards: referral?.totalRewards || 0
    };
  };
  
  // Generate referral link
  const generateReferralLink = (): string => {
    if (!referral) return '';
    return `https://maligamepass.com/refer/${referral.referralCode}`;
  };

  return (
    <PromotionContext.Provider
      value={{
        promotions,
        userPromotions,
        cashbacks,
        referral,
        getActivePromotions,
        getPromotionById,
        claimPromotion,
        applyPromotion,
        getTotalCashbackBalance,
        getAvailableCashback,
        useCashback,
        getReferralCode,
        getReferralStats,
        generateReferralLink,
        isLoading,
        error
      }}
    >
      {children}
    </PromotionContext.Provider>
  );
}

// Custom hook to use the promotion context
export function usePromotion() {
  const context = useContext(PromotionContext);
  if (context === undefined) {
    throw new Error('usePromotion must be used within a PromotionProvider');
  }
  return context;
} 