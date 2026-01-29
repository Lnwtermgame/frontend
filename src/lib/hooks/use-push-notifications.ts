"use client";

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

interface PushState {
  isSupported: boolean;
  subscription: PushSubscription | null;
  permissionState: PermissionState;
  isSubscribing: boolean;
  isUnsubscribing: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const { user } = useAuth();
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);
  const [state, setState] = useState<PushState>({
    isSupported: false,
    subscription: null,
    permissionState: 'prompt',
    isSubscribing: false,
    isUnsubscribing: false,
    error: null
  });

  // Check if push notifications are supported
  useEffect(() => {
    const checkSupport = async () => {
      const isSupported = 'serviceWorker' in navigator && 
                        'PushManager' in window && 
                        'Notification' in window;
      
      setState(prev => ({ ...prev, isSupported }));
      
      if (isSupported) {
        // Check current permission state
        setState(prev => ({ 
          ...prev, 
          permissionState: Notification.permission as PermissionState 
        }));
        
        // Get VAPID public key
        try {
          const response = await fetch('/api/push/vapid-key');
          const data = await response.json();
          setVapidPublicKey(data.publicKey);
        } catch (error) {
          console.error('Failed to fetch VAPID key:', error);
        }
        
        // Register service worker if it's not already registered
        try {
          const registration = await navigator.serviceWorker.register('/service-worker.js');
          
          // Check if there's an existing subscription
          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            setState(prev => ({ ...prev, subscription: existingSub }));
          }
        } catch (error) {
          console.error('Service worker registration failed:', error);
          setState(prev => ({ 
            ...prev, 
            error: 'Failed to register service worker' 
          }));
        }
      }
    };
    
    checkSupport();
  }, []);

  // Convert base64 string to Uint8Array for the applicationServerKey
  const urlB64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  };

  // Subscribe to push notifications
  const subscribe = async () => {
    if (!state.isSupported || !vapidPublicKey || !user) return;
    
    setState(prev => ({ ...prev, isSubscribing: true, error: null }));
    
    try {
      // Request notification permission if not already granted
      if (state.permissionState !== 'granted') {
        const permission = await Notification.requestPermission();
        setState(prev => ({ ...prev, permissionState: permission as PermissionState }));
        
        if (permission !== 'granted') {
          setState(prev => ({ 
            ...prev, 
            isSubscribing: false,
            error: 'Notification permission denied' 
          }));
          return;
        }
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Create subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
      });
      
      // Send subscription to server
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          userToken: user.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          subscription, 
          isSubscribing: false 
        }));
      } else {
        throw new Error(data.message || 'Subscription failed');
      }
    } catch (error) {
      console.error('Failed to subscribe:', error);
      setState(prev => ({ 
        ...prev, 
        isSubscribing: false,
        error: error instanceof Error ? error.message : 'Failed to subscribe to push notifications' 
      }));
    }
  };

  // Unsubscribe from push notifications
  const unsubscribe = async () => {
    if (!state.subscription || !user) return;
    
    setState(prev => ({ ...prev, isUnsubscribing: true, error: null }));
    
    try {
      // Unsubscribe from push manager
      await state.subscription.unsubscribe();
      
      // Notify server
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userToken: user.id
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ 
          ...prev, 
          subscription: null, 
          isUnsubscribing: false 
        }));
      } else {
        throw new Error(data.message || 'Unsubscription failed');
      }
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      setState(prev => ({ 
        ...prev, 
        isUnsubscribing: false,
        error: error instanceof Error ? error.message : 'Failed to unsubscribe from push notifications' 
      }));
    }
  };

  return {
    ...state,
    isSubscribed: !!state.subscription,
    subscribe,
    unsubscribe
  };
} 