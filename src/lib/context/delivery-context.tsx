"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { useAuth } from '../hooks/use-auth';

export interface DeliveryItem {
  id: string;
  orderId: string;
  userId: string;
  productId: string;
  productName: string;
  productType: 'digital_code' | 'account_credentials' | 'game_topup' | 'gift_card' | 'other';
  quantity: number;
  deliveryStatus: 'pending' | 'processing' | 'delivered' | 'failed' | 'cancelled';
  deliveryMethod: 'email' | 'sms' | 'in_app' | 'api';
  deliveryData?: {
    code?: string;
    username?: string;
    password?: string;
    expiryDate?: string;
    activationInstructions?: string;
    gameAccount?: string;
  };
  estimatedDeliveryTime?: string;
  actualDeliveryTime?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLog {
  id: string;
  deliveryId: string;
  status: string;
  message: string;
  timestamp: string;
}

type DeliveryContextType = {
  deliveryItems: DeliveryItem[];
  deliveryLogs: Record<string, DeliveryLog[]>;
  getDeliveryById: (id: string) => DeliveryItem | undefined;
  getDeliveryByOrderId: (orderId: string) => DeliveryItem[];
  processDelivery: (orderId: string) => Promise<boolean>;
  retryDelivery: (deliveryId: string) => Promise<boolean>;
  cancelDelivery: (deliveryId: string) => Promise<boolean>;
  resendDeliveryData: (deliveryId: string, method?: 'email' | 'sms' | 'in_app') => Promise<boolean>;
  trackDelivery: (deliveryId: string) => DeliveryLog[];
  isPending: boolean;
  error: string | null;
};

export const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export function DeliveryProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || 'guest';
  
  // Mock delivery items for demo purposes
  const [deliveryItems, setDeliveryItems] = useLocalStorage<DeliveryItem[]>('mali-gamepass-delivery-items', [
    {
      id: 'dlv-001',
      orderId: 'ord-001',
      userId: userId,
      productId: 'prod-001',
      productName: 'PUBG Mobile 600 UC',
      productType: 'game_topup',
      quantity: 1,
      deliveryStatus: 'delivered',
      deliveryMethod: 'in_app',
      deliveryData: {
        gameAccount: 'PUBG123456',
      },
      retryCount: 0,
      createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      updatedAt: new Date(Date.now() - 3540000).toISOString(), // 59 minutes ago
      actualDeliveryTime: new Date(Date.now() - 3540000).toISOString(),
    },
    {
      id: 'dlv-002',
      orderId: 'ord-002',
      userId: userId,
      productId: 'prod-002',
      productName: 'Steam $50 Gift Card',
      productType: 'digital_code',
      quantity: 1,
      deliveryStatus: 'pending',
      deliveryMethod: 'email',
      estimatedDeliveryTime: new Date(Date.now() + 300000).toISOString(), // 5 minutes from now
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'dlv-003',
      orderId: 'ord-003',
      userId: userId,
      productId: 'prod-003',
      productName: 'Netflix Premium 1 Month',
      productType: 'account_credentials',
      quantity: 1,
      deliveryStatus: 'failed',
      deliveryMethod: 'email',
      failureReason: 'Payment verification failed',
      retryCount: 2,
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
      updatedAt: new Date(Date.now() - 82800000).toISOString(), // 23 hours ago
    }
  ]);

  // Mock delivery logs
  const [deliveryLogs, setDeliveryLogs] = useLocalStorage<Record<string, DeliveryLog[]>>('mali-gamepass-delivery-logs', {
    'dlv-001': [
      {
        id: 'log-001-1',
        deliveryId: 'dlv-001',
        status: 'created',
        message: 'Delivery created',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'log-001-2',
        deliveryId: 'dlv-001',
        status: 'processing',
        message: 'Processing delivery',
        timestamp: new Date(Date.now() - 3580000).toISOString(),
      },
      {
        id: 'log-001-3',
        deliveryId: 'dlv-001',
        status: 'delivered',
        message: 'Successfully delivered to game account PUBG123456',
        timestamp: new Date(Date.now() - 3540000).toISOString(),
      }
    ],
    'dlv-002': [
      {
        id: 'log-002-1',
        deliveryId: 'dlv-002',
        status: 'created',
        message: 'Delivery created',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'log-002-2',
        deliveryId: 'dlv-002',
        status: 'pending',
        message: 'Waiting for payment confirmation',
        timestamp: new Date().toISOString(),
      }
    ],
    'dlv-003': [
      {
        id: 'log-003-1',
        deliveryId: 'dlv-003',
        status: 'created',
        message: 'Delivery created',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'log-003-2',
        deliveryId: 'dlv-003',
        status: 'processing',
        message: 'Processing delivery',
        timestamp: new Date(Date.now() - 86300000).toISOString(),
      },
      {
        id: 'log-003-3',
        deliveryId: 'dlv-003',
        status: 'failed',
        message: 'Payment verification failed',
        timestamp: new Date(Date.now() - 86200000).toISOString(),
      },
      {
        id: 'log-003-4',
        deliveryId: 'dlv-003',
        status: 'retry',
        message: 'Retrying delivery',
        timestamp: new Date(Date.now() - 84400000).toISOString(),
      },
      {
        id: 'log-003-5',
        deliveryId: 'dlv-003',
        status: 'failed',
        message: 'Payment verification failed',
        timestamp: new Date(Date.now() - 82800000).toISOString(),
      }
    ]
  });

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get delivery by ID
  const getDeliveryById = (id: string): DeliveryItem | undefined => {
    return deliveryItems.find(item => item.id === id);
  };

  // Get deliveries by order ID
  const getDeliveryByOrderId = (orderId: string): DeliveryItem[] => {
    return deliveryItems.filter(item => item.orderId === orderId);
  };

  // Process a new delivery
  const processDelivery = async (orderId: string): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In a real implementation, this would communicate with a backend service
      // to process the delivery of digital goods
      
      // For demonstration purposes, we'll simulate a successful delivery
      const timestamp = new Date().toISOString();
      const newDeliveryId = `dlv-${Date.now()}`;
      
      // Create a new delivery item
      const newDelivery: DeliveryItem = {
        id: newDeliveryId,
        orderId,
        userId,
        productId: `prod-${Math.floor(1000 + Math.random() * 9000)}`,
        productName: 'New Digital Product',
        productType: 'digital_code',
        quantity: 1,
        deliveryStatus: 'delivered',
        deliveryMethod: 'email',
        deliveryData: {
          code: `CODE-${Math.floor(10000 + Math.random() * 90000)}`,
          activationInstructions: 'Redeem this code on the official website.'
        },
        retryCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        actualDeliveryTime: timestamp
      };
      
      // Create delivery logs
      const newLogs: DeliveryLog[] = [
        {
          id: `log-${newDeliveryId}-1`,
          deliveryId: newDeliveryId,
          status: 'created',
          message: 'Delivery created',
          timestamp
        },
        {
          id: `log-${newDeliveryId}-2`,
          deliveryId: newDeliveryId,
          status: 'processing',
          message: 'Processing delivery',
          timestamp: new Date(Date.parse(timestamp) + 1000).toISOString()
        },
        {
          id: `log-${newDeliveryId}-3`,
          deliveryId: newDeliveryId,
          status: 'delivered',
          message: 'Successfully delivered by email',
          timestamp: new Date(Date.parse(timestamp) + 2000).toISOString()
        }
      ];
      
      // Update state
      setDeliveryItems(prev => [newDelivery, ...prev]);
      setDeliveryLogs(prev => ({
        ...prev,
        [newDeliveryId]: newLogs
      }));
      
      return true;
    } catch (error) {
      setError(`Failed to process delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  // Retry a failed delivery
  const retryDelivery = async (deliveryId: string): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    
    try {
      const delivery = getDeliveryById(deliveryId);
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      if (delivery.deliveryStatus !== 'failed') {
        throw new Error('Only failed deliveries can be retried');
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 70% chance of success on retry (for demo purposes)
      const isSuccessful = Math.random() > 0.3;
      const timestamp = new Date().toISOString();
      
      // Update delivery item
      setDeliveryItems(prev => prev.map(item => {
        if (item.id === deliveryId) {
          return {
            ...item,
            deliveryStatus: isSuccessful ? 'delivered' : 'failed',
            failureReason: isSuccessful ? undefined : 'Retry failed - payment issue',
            retryCount: item.retryCount + 1,
            updatedAt: timestamp,
            actualDeliveryTime: isSuccessful ? timestamp : undefined
          };
        }
        return item;
      }));
      
      // Add new log
      const newLog: DeliveryLog = {
        id: `log-${deliveryId}-${Date.now()}`,
        deliveryId,
        status: isSuccessful ? 'delivered' : 'failed',
        message: isSuccessful 
          ? 'Successfully delivered after retry' 
          : 'Retry failed - payment issue',
        timestamp
      };
      
      setDeliveryLogs(prev => ({
        ...prev,
        [deliveryId]: [...(prev[deliveryId] || []), newLog]
      }));
      
      return isSuccessful;
    } catch (error) {
      setError(`Failed to retry delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  // Cancel a pending delivery
  const cancelDelivery = async (deliveryId: string): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    
    try {
      const delivery = getDeliveryById(deliveryId);
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      if (delivery.deliveryStatus !== 'pending' && delivery.deliveryStatus !== 'processing') {
        throw new Error('Only pending or processing deliveries can be cancelled');
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const timestamp = new Date().toISOString();
      
      // Update delivery item
      setDeliveryItems(prev => prev.map(item => {
        if (item.id === deliveryId) {
          return {
            ...item,
            deliveryStatus: 'cancelled',
            updatedAt: timestamp
          };
        }
        return item;
      }));
      
      // Add new log
      const newLog: DeliveryLog = {
        id: `log-${deliveryId}-${Date.now()}`,
        deliveryId,
        status: 'cancelled',
        message: 'Delivery cancelled by user',
        timestamp
      };
      
      setDeliveryLogs(prev => ({
        ...prev,
        [deliveryId]: [...(prev[deliveryId] || []), newLog]
      }));
      
      return true;
    } catch (error) {
      setError(`Failed to cancel delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  // Resend delivery data to user
  const resendDeliveryData = async (
    deliveryId: string, 
    method: 'email' | 'sms' | 'in_app' = 'email'
  ): Promise<boolean> => {
    setIsPending(true);
    setError(null);
    
    try {
      const delivery = getDeliveryById(deliveryId);
      
      if (!delivery) {
        throw new Error('Delivery not found');
      }
      
      if (delivery.deliveryStatus !== 'delivered') {
        throw new Error('Only delivered items can be resent');
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const timestamp = new Date().toISOString();
      
      // Add new log
      const newLog: DeliveryLog = {
        id: `log-${deliveryId}-${Date.now()}`,
        deliveryId,
        status: 'resent',
        message: `Delivery data resent via ${method}`,
        timestamp
      };
      
      setDeliveryLogs(prev => ({
        ...prev,
        [deliveryId]: [...(prev[deliveryId] || []), newLog]
      }));
      
      return true;
    } catch (error) {
      setError(`Failed to resend delivery: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setIsPending(false);
    }
  };

  // Track a delivery
  const trackDelivery = (deliveryId: string): DeliveryLog[] => {
    return deliveryLogs[deliveryId] || [];
  };

  return (
    <DeliveryContext.Provider
      value={{
        deliveryItems,
        deliveryLogs,
        getDeliveryById,
        getDeliveryByOrderId,
        processDelivery,
        retryDelivery,
        cancelDelivery,
        resendDeliveryData,
        trackDelivery,
        isPending,
        error
      }}
    >
      {children}
    </DeliveryContext.Provider>
  );
}

// Custom hook to use the delivery context
export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (context === undefined) {
    throw new Error('useDelivery must be used within a DeliveryProvider');
  }
  return context;
} 