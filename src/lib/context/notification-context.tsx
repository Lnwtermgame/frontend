"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
  createdAt: string;
  read: boolean;
}

type NotificationContextType = {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  dismissNotification: (id: string) => void;
};

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useLocalStorage<Notification[]>('mali-gamepass-notifications', []);
  const unreadCount = notifications.filter(notification => !notification.read).length;

  // Mock some initial notifications for demo purposes
  useEffect(() => {
    if (notifications.length === 0) {
      const initialNotifications: Notification[] = [
        {
          id: '1',
          title: 'Welcome to MaliGamePass',
          message: 'Thank you for joining! Get started by exploring our game collections.',
          type: 'info',
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
          read: false
        },
        {
          id: '2',
          title: '20% Discount Coupon',
          message: 'You have received a special discount on your first purchase!',
          type: 'success',
          link: '/dashboard/coupons',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          read: false
        },
        {
          id: '3',
          title: 'New Games Added',
          message: 'Check out the latest games that have just been added to our collection.',
          type: 'info',
          link: '/dashboard/orders/ORD-1002', // Updated as per instruction
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
          read: true
        }
      ];

      setNotifications(initialNotifications);
    }
  }, []);

  // Add a new notification
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Trigger browser notification if supported
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(notification.title, { body: notification.message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(notification.title, { body: notification.message });
          }
        });
      }
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Remove a specific notification
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Clear all notifications
  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        dismissNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

// Custom hook to use the notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
} 
