"use client";

import { createContext, useContext, ReactNode } from "react";
import { useLocalStorage } from "../hooks/use-local-storage";

// Cart item type with playerInfo for direct top-up
export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  playerInfo?: Record<string, string>; // For direct top-up products
  productType?: "CARD" | "DIRECT_TOPUP";
}

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
};

// Create the context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>("cart", []);

  // Add item to cart
  const addItem = (item: CartItem) => {
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
          // Update playerInfo if provided
          ...(item.playerInfo && { playerInfo: item.playerInfo }),
        };
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, item];
      }
    });
  };

  // Remove item from cart
  const removeItem = (productId: string) => {
    setItems((prevItems) =>
      prevItems.filter((item) => item.productId !== productId)
    );
  };

  // Update item quantity
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  // Update player info for direct top-up
  const updatePlayerInfo = (
    productId: string,
    playerInfo: Record<string, string>
  ) => {
    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId) {
          return { ...item, playerInfo };
        }
        return item;
      })
    );
  };

  // Clear cart
  const clearCart = () => {
    setItems([]);
  };

  // Get total number of items in cart
  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  // Get total price of items in cart
  const getTotalPrice = () => {
    return items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  };

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
