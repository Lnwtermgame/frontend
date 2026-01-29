"use client";

// Types imports for cart items
import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';

// Product and cart item types
export interface Product {
  id: string;
  name: string;
  image: string;
  description: string;
  platform: string;
  startingPrice: number;
  currency: string;
  denominations: Denomination[];
  servers: Server[];
  categoryId: string;
}

export interface Denomination {
  id: string;
  value: string;
  price: number;
}

export interface Server {
  id: string;
  name: string;
}

export interface CartItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  denomination: Denomination;
  options: any;
}

// Cart context type
type CartContextType = {
  items: CartItem[];
  addItem: (product: Product, quantity: number, denomination: Denomination, options: any) => void;
  removeItem: (productId: string, denominationId: string) => void;
  updateQuantity: (productId: string, denominationId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
};

// Create the context
export const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useLocalStorage<CartItem[]>('cart', []);

  // Add item to cart
  const addItem = (
    product: Product,
    quantity: number,
    denomination: Denomination,
    options: any
  ) => {
    setItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        (item) => item.productId === product.id && item.denomination.id === denomination.id
      );

      if (existingItemIndex > -1) {
        // Update existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
        };
        return updatedItems;
      } else {
        // Add new item
        return [
          ...prevItems,
          {
            productId: product.id,
            name: product.name,
            image: product.image,
            quantity,
            denomination,
            options,
          },
        ];
      }
    });
  };

  // Remove item from cart
  const removeItem = (productId: string, denominationId: string) => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.productId === productId && item.denomination.id === denominationId)
      )
    );
  };

  // Update item quantity
  const updateQuantity = (productId: string, denominationId: string, quantity: number) => {
    if (quantity < 1) return;

    setItems((prevItems) =>
      prevItems.map((item) => {
        if (item.productId === productId && item.denomination.id === denominationId) {
          return { ...item, quantity };
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
    return items.reduce((total, item) => total + (item.denomination.price * item.quantity), 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
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
