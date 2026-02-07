"use client";

import { createContext, useContext, ReactNode, useCallback, useState, useEffect, useRef } from "react";
import { useLocalStorage } from "../hooks/use-local-storage";
import { useAuth } from "../hooks/use-auth";
import { cartClient } from "../client/gateway";

// Cart item type with playerInfo for direct top-up
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  playerInfo?: Record<string, string>; // For direct top-up products
  productType?: "CARD" | "DIRECT_TOPUP";
  deviceId?: string; // Device that added this item
  deviceInfo?: string; // Device name/browser info
  addedAt?: string; // ISO timestamp when item was added
  updatedAt?: string; // ISO timestamp when item was last updated
}

// Sync status type
export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

// Sync strategy type
export type SyncStrategy = 'merge' | 'replace' | 'server-wins' | 'client-wins';

// Cart context type
type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updatePlayerInfo: (productId: string, playerInfo: Record<string, string>) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  // Sync features
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  syncError: string | null;
  syncCart: (strategy?: SyncStrategy) => Promise<void>;
  isOnline: boolean;
  pendingSync: boolean;
};

// Create the context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Generate a unique device ID
const generateDeviceId = () => {
  if (typeof window === 'undefined') return 'server';
  const stored = localStorage.getItem('cart_device_id');
  if (stored) return stored;
  const newId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  localStorage.setItem('cart_device_id', newId);
  return newId;
};

// Get device info
const getDeviceInfo = () => {
  if (typeof window === 'undefined') return 'Server';
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  // Detect browser
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Detect device type
  const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(userAgent);
  const deviceType = isMobile ? 'Mobile' : 'Desktop';

  return `${browser} on ${deviceType}`;
};

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart", []);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSync, setPendingSync] = useState<boolean>(false);

  const { isAuthenticated } = useAuth();
  const deviceId = useRef(generateDeviceId());
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-sync when user logs in or comes back online
  useEffect(() => {
    if (isAuthenticated && isOnline && syncStatus === 'idle') {
      syncCart('merge');
    }
  }, [isAuthenticated, isOnline]);

  // Debounced auto-sync on cart changes
  useEffect(() => {
    if (!isAuthenticated || !isOnline) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new timeout for auto-sync (debounce 2 seconds)
    syncTimeoutRef.current = setTimeout(() => {
      if (items.length > 0) {
        syncCart('merge');
      }
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [items, isAuthenticated, isOnline]);

  // Sync cart with server
  const syncCart = useCallback(async (strategy: SyncStrategy = 'merge') => {
    if (!isAuthenticated) {
      setSyncError('Please login to sync cart');
      return;
    }

    if (!isOnline) {
      setPendingSync(true);
      setSyncError('You are offline. Cart will sync when connection is restored.');
      return;
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const syncData = {
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          deviceId: item.deviceId || deviceId.current,
          deviceInfo: item.deviceInfo || getDeviceInfo(),
          addedAt: item.addedAt,
          updatedAt: item.updatedAt,
        })),
        deviceId: deviceId.current,
        deviceInfo: getDeviceInfo(),
        strategy,
        lastSyncedAt: lastSyncedAt?.toISOString(),
      };

      const response = await cartClient.post('/api/cart/sync', syncData);

      if (response.data?.success) {
        const { cart, syncSummary } = response.data.data;

        // Update local cart with server data
        if (strategy !== 'client-wins' && cart.items) {
          const serverItems: CartItem[] = cart.items.map((serverItem: any) => ({
            productId: serverItem.productId,
            name: serverItem.product.name,
            image: serverItem.product.imageUrl || '',
            quantity: serverItem.quantity,
            price: serverItem.product.price,
            productType: serverItem.product.productType,
            deviceId: serverItem.deviceId,
            deviceInfo: serverItem.deviceInfo,
            addedAt: serverItem.addedAt,
            updatedAt: serverItem.updatedAt,
          }));

          setItems(serverItems);
        }

        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setPendingSync(false);

        console.log('[Cart Sync] Success:', syncSummary);
      }
    } catch (error: any) {
      console.error('[Cart Sync] Error:', error);
      setSyncStatus('error');
      setSyncError(error.response?.data?.error?.message || 'Failed to sync cart');
      setPendingSync(true);
    }
  }, [isAuthenticated, isOnline, items, lastSyncedAt, setItems]);

  // Add item to cart
  const addItem = useCallback((item: CartItem) => {
    const now = new Date().toISOString();
    setItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (i) => i.productId === item.productId
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + item.quantity,
          deviceId: deviceId.current,
          deviceInfo: getDeviceInfo(),
          updatedAt: now,
          // Update playerInfo if provided
          ...(item.playerInfo && { playerInfo: item.playerInfo }),
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          ...item,
          deviceId: deviceId.current,
          deviceInfo: getDeviceInfo(),
          addedAt: now,
          updatedAt: now,
        }];
      }
    });
  }, [setItems]);

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  }, [setItems]);

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    const now = new Date().toISOString();

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            quantity,
            deviceId: deviceId.current,
            deviceInfo: getDeviceInfo(),
            updatedAt: now,
          };
        }
        return item;
      })
    );
  }, [setItems]);

  // Update player info for direct top-up
  const updatePlayerInfo = useCallback((
    productId: string,
    playerInfo: Record<string, string>
  ) => {
    const now = new Date().toISOString();
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          return {
            ...item,
            playerInfo,
            deviceId: deviceId.current,
            deviceInfo: getDeviceInfo(),
            updatedAt: now,
          };
        }
        return item;
      })
    );
  }, [setItems]);

  // Clear cart
  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  // Get total number of items in cart
  const getTotalItems = useCallback(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  // Get total price of items in cart
  const getTotalPrice = useCallback(() => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updatePlayerInfo,
        clearCart,
        getTotalItems,
        getTotalPrice,
        // Sync features
        syncStatus,
        lastSyncedAt,
        syncError,
        syncCart,
        isOnline,
        pendingSync,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
