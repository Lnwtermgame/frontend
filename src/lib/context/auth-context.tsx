"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocalStorage } from '../hooks/use-local-storage';
import { validateUser } from '../data/mock-users';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'user' | 'admin';
  credits: number;
  isPremium: boolean;
  createdAt: string;
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useLocalStorage<User | null>('mali-gamepass-user', null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  // Check for existing session on initial load
  useEffect(() => {
    // We could perform token validation here in a real app
    const checkSession = async () => {
      // For now we just rely on localStorage user data
    };
    
    checkSession();
  }, []);

  // Simulate login
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In frontend-only mode, this validates against mock data
      const user = await validateUser(email, password);
      
      if (user) {
        setUser(user);
        setIsLoading(false);
        return true;
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
        return false;
      }
    } catch (err) {
      setError('An error occurred during login');
      setIsLoading(false);
      return false;
    }
  };
  
  // Simulate logout
  const logout = () => {
    setUser(null);
  };

  // Clear error state
  const clearError = () => {
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      error, 
      isAuthenticated, 
      isAdmin,
      login, 
      logout,
      clearError
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 