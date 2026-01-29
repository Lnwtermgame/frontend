"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { useAuth } from '../hooks/use-auth';

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: '2fa-app' | 'sms' | 'email' | null;
  emailVerified: boolean;
  passwordLastChanged: string | null;
  loginNotifications: boolean;
  securityQuestions: boolean;
  recentDevices: Device[];
  suspiciousActivities: Activity[];
}

export interface Device {
  id: string;
  name: string;
  browser: string;
  os: string;
  ip: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface Activity {
  id: string;
  type: 'login' | 'password-change' | 'security-settings' | 'payment' | 'other';
  description: string;
  ip: string;
  location: string;
  timestamp: string;
  suspicious: boolean;
  resolved: boolean;
}

type SecurityContextType = {
  securitySettings: SecuritySettings;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  sendVerificationEmail: () => Promise<boolean>;
  setupTwoFactor: (method: '2fa-app' | 'sms' | 'email') => Promise<{ success: boolean; secret?: string; qrCodeUrl?: string; }>;
  verifyTwoFactorCode: (code: string) => Promise<boolean>;
  disableTwoFactor: (password: string) => Promise<boolean>;
  logoutAllDevices: () => Promise<boolean>;
  removeDevice: (deviceId: string) => Promise<boolean>;
  resolveActivity: (activityId: string) => void;
  isLoadingSettings: boolean;
  is2FAVerified: boolean;
  generateBackupCodes: () => Promise<string[]>;
};

export const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);
  const [is2FAVerified, setIs2FAVerified] = useState(false);
  
  // Mock security settings for demo purposes
  const [securitySettings, setSecuritySettings] = useLocalStorage<SecuritySettings>('mali-gamepass-security', {
    twoFactorEnabled: false,
    twoFactorMethod: null,
    emailVerified: false,
    passwordLastChanged: null,
    loginNotifications: true,
    securityQuestions: false,
    recentDevices: [
      {
        id: 'device-1',
        name: 'Current Device',
        browser: 'Chrome',
        os: 'Windows',
        ip: '198.51.100.42',
        location: 'Bangkok, Thailand',
        lastActive: new Date().toISOString(),
        isCurrent: true
      },
      {
        id: 'device-2',
        name: 'iPhone 13',
        browser: 'Safari',
        os: 'iOS 15',
        ip: '203.0.113.75',
        location: 'Bangkok, Thailand',
        lastActive: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days ago
        isCurrent: false
      }
    ],
    suspiciousActivities: [
      {
        id: 'activity-1',
        type: 'login',
        description: 'Login attempt from unknown location',
        ip: '203.0.113.100',
        location: 'Moscow, Russia',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(), // 3 days ago
        suspicious: true,
        resolved: false
      }
    ]
  });

  const updateSecuritySettings = (settings: Partial<SecuritySettings>) => {
    setSecuritySettings(prevSettings => ({
      ...prevSettings,
      ...settings
    }));
  };

  // Mock sending verification email
  const sendVerificationEmail = async (): Promise<boolean> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Mock setting up 2FA
  const setupTwoFactor = async (method: '2fa-app' | 'sms' | 'email'): Promise<{ success: boolean; secret?: string; qrCodeUrl?: string; }> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const secret = 'JBSWY3DPEHPK3PXP'; // Mock secret
      const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=otpauth://totp/MaliGamePass:${user?.email || 'user'}?secret=${secret}&issuer=MaliGamePass&algorithm=SHA1&digits=6&period=30`;
      
      return {
        success: true,
        secret,
        qrCodeUrl
      };
    } catch (error) {
      console.error('Error setting up 2FA:', error);
      return { success: false };
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Mock verifying 2FA code
  const verifyTwoFactorCode = async (code: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always succeed if code is 123456 (for demo)
      const isValid = code === '123456';
      
      if (isValid) {
        setIs2FAVerified(true);
        updateSecuritySettings({
          twoFactorEnabled: true,
          twoFactorMethod: securitySettings.twoFactorMethod || '2fa-app'
        });
      }
      
      return isValid;
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Mock disabling 2FA
  const disableTwoFactor = async (password: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Always succeed with 'password' (for demo)
      const isValid = password === 'password';
      
      if (isValid) {
        updateSecuritySettings({
          twoFactorEnabled: false,
          twoFactorMethod: null
        });
      }
      
      return isValid;
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Mock logout from all devices
  const logoutAllDevices = async (): Promise<boolean> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update devices to only keep current one
      updateSecuritySettings({
        recentDevices: securitySettings.recentDevices.filter(device => device.isCurrent)
      });
      
      return true;
    } catch (error) {
      console.error('Error logging out all devices:', error);
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Mock removing a device
  const removeDevice = async (deviceId: string): Promise<boolean> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Cannot remove current device
      const device = securitySettings.recentDevices.find(d => d.id === deviceId);
      if (device?.isCurrent) {
        return false;
      }
      
      // Update devices list
      updateSecuritySettings({
        recentDevices: securitySettings.recentDevices.filter(device => device.id !== deviceId)
      });
      
      return true;
    } catch (error) {
      console.error('Error removing device:', error);
      return false;
    } finally {
      setIsLoadingSettings(false);
    }
  };

  // Mark suspicious activity as resolved
  const resolveActivity = (activityId: string) => {
    updateSecuritySettings({
      suspiciousActivities: securitySettings.suspiciousActivities.map(activity =>
        activity.id === activityId ? { ...activity, resolved: true } : activity
      )
    });
  };

  // Generate backup codes for 2FA
  const generateBackupCodes = async (): Promise<string[]> => {
    setIsLoadingSettings(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate 10 random backup codes
      const codes = Array.from({ length: 10 }, () => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        return `${code.slice(0, 3)}-${code.slice(3)}`;
      });
      
      return codes;
    } catch (error) {
      console.error('Error generating backup codes:', error);
      return [];
    } finally {
      setIsLoadingSettings(false);
    }
  };

  return (
    <SecurityContext.Provider
      value={{
        securitySettings,
        updateSecuritySettings,
        sendVerificationEmail,
        setupTwoFactor,
        verifyTwoFactorCode,
        disableTwoFactor,
        logoutAllDevices,
        removeDevice,
        resolveActivity,
        isLoadingSettings,
        is2FAVerified,
        generateBackupCodes
      }}
    >
      {children}
    </SecurityContext.Provider>
  );
}

// Custom hook to use the security context
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
} 