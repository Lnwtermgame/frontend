"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-exports';
import { X, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/lib/context/auth-context';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { login, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (email && password) {
      const success = await login(email, password);
      if (success) {
        onClose();
        setEmail('');
        setPassword('');
      }
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%] max-w-md bg-mali-card border border-mali-blue/30 rounded-lg overflow-hidden shadow-xl z-50"
          >
            {/* Header */}
            <div className="relative p-5 border-b border-mali-blue/20">
              <h2 className="text-white text-xl font-medium text-center">เข้าสู่ระบบ</h2>
              <button 
                onClick={onClose}
                className="absolute top-5 right-5 text-mali-text-secondary hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Form */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Error message */}
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}
              
              {/* Demo accounts info box */}
              <div className="bg-mali-blue/20 border border-mali-blue/30 text-mali-text-secondary px-4 py-3 rounded-md text-sm">
                <p className="mb-1 text-white">Demo Accounts:</p>
                <p className="mb-0.5">john@example.com / password123</p>
                <p>jane@example.com / password456</p>
              </div>
              
              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm text-mali-text-secondary">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mali-text-secondary">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-mali-blue/20 border border-mali-blue/30 rounded-md px-10 py-2.5 text-white placeholder:text-mali-text-secondary focus:outline-none focus:ring-1 focus:ring-mali-blue"
                    required
                  />
                </div>
              </div>
              
              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm text-mali-text-secondary">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mali-text-secondary">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full bg-mali-blue/20 border border-mali-blue/30 rounded-md px-10 py-2.5 text-white placeholder:text-mali-text-secondary focus:outline-none focus:ring-1 focus:ring-mali-blue"
                    required
                  />
                  <button
                    type="button"
                    onClick={toggleShowPassword}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-mali-text-secondary hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              
              {/* Submit button */}
              <motion.button
                type="submit"
                className="w-full bg-button-gradient text-white py-2.5 rounded-md font-medium mt-4 flex items-center justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    กำลังเข้าสู่ระบบ...
                  </div>
                ) : 'เข้าสู่ระบบ'}
              </motion.button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
} 
