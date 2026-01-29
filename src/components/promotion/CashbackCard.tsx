"use client";

import { useState } from 'react';
import { motion } from '@/lib/framer-exports';
import { usePromotion, Cashback } from '@/lib/context/promotion-context';
import { 
  CircleDollarSign, 
  Clock, 
  InfoIcon, 
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';

export interface CashbackCardProps {
  compact?: boolean;
  // Add new props to match what we're passing from the cashback page
  title?: string;
  description?: string;
  amount?: string;
  minSpend?: number;
  maxCashback?: number;
  expiryDate?: string;
  image?: string;
  isSpecial?: boolean;
}

export function CashbackCard({ 
  compact = false,
  title,
  description,
  amount,
  minSpend,
  maxCashback,
  expiryDate,
  image,
  isSpecial
}: CashbackCardProps) {
  const { 
    getTotalCashbackBalance, 
    getAvailableCashback,
    cashbacks,
    useCashback, 
    isLoading,
    error
  } = usePromotion();
  
  const [showHistory, setShowHistory] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
  const totalCashback = getTotalCashbackBalance();
  const availableCashbacks = getAvailableCashback();
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  const handleUseCashback = async () => {
    if (!amountInput || parseFloat(amountInput) <= 0 || parseFloat(amountInput) > totalCashback) {
      setMessage({ 
        type: 'error', 
        text: `Please enter a valid amount between 0 and ${totalCashback.toFixed(2)}` 
      });
      return;
    }
    
    const result = await useCashback(parseFloat(amountInput));
    
    if (result) {
      setMessage({ type: 'success', text: `Successfully used ${amountInput} credits` });
      setAmountInput('');
    } else {
      setMessage({ type: 'error', text: error || 'Failed to use cashback' });
    }
    
    setTimeout(() => setMessage(null), 5000);
  };
  
  // If we're passing specific cashback offer props, show a different card UI
  if (title && description && amount) {
    return (
      <div className={`bg-mali-card border ${isSpecial ? 'border-blue-500/30' : 'border-mali-blue/20'} rounded-xl overflow-hidden flex flex-col h-full`}>
        {/* Card Image */}
        {image && (
          <div className="relative h-48 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10"></div>
            <img src={image} alt={title} className="w-full h-full object-cover" />
            {isSpecial && (
              <div className="absolute top-3 right-3 bg-blue-500/90 text-white text-xs font-bold px-2 py-1 rounded-full z-20">
                SPECIAL OFFER
              </div>
            )}
            <div className="absolute bottom-3 left-3 z-10">
              <div className="text-3xl font-bold text-white">{amount}</div>
              <div className="text-sm text-white/80">cashback</div>
            </div>
          </div>
        )}
        
        <div className="p-4 flex-grow">
          <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
          <p className="text-sm text-gray-400 mb-4">{description}</p>
          
          <div className="space-y-3 text-sm">
            {minSpend && (
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum spend:</span>
                <span className="text-white">${minSpend}</span>
              </div>
            )}
            
            {maxCashback && (
              <div className="flex justify-between">
                <span className="text-gray-400">Max cashback:</span>
                <span className="text-white">${maxCashback}</span>
              </div>
            )}
            
            {expiryDate && (
              <div className="flex justify-between">
                <span className="text-gray-400">Expires:</span>
                <span className="text-white">{formatDate(expiryDate)}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-mali-blue/20">
          <button className="w-full bg-mali-blue text-white py-2 rounded-lg hover:bg-mali-blue/90 transition-colors">
            Activate Offer
          </button>
        </div>
      </div>
    );
  }
  
  if (compact) {
    return (
      <div className="bg-mali-card border border-mali-blue/20 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CircleDollarSign className="text-green-400" size={20} />
            <h3 className="font-medium text-white">Cashback Balance</h3>
          </div>
          <div className="text-lg font-semibold text-green-400">${totalCashback.toFixed(2)}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-mali-card border border-mali-blue/20 rounded-xl overflow-hidden">
      <div className="p-4 bg-mali-blue/10 border-b border-mali-blue/20 flex justify-between items-center">
        <h3 className="font-medium text-white flex items-center gap-2">
          <CircleDollarSign className="text-mali-blue-accent" />
          Cashback Balance
        </h3>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Balance Display */}
        <div className="flex flex-col items-center py-6 px-4 bg-gradient-to-r from-green-900/30 to-mali-blue/10 rounded-lg border border-green-700/20">
          <div className="text-sm text-gray-400 mb-1">Available Balance</div>
          <div className="text-3xl font-bold text-green-400 mb-1">${totalCashback.toFixed(2)}</div>
          <div className="text-xs text-gray-400">
            {availableCashbacks.length} cashback item{availableCashbacks.length !== 1 ? 's' : ''}
          </div>
        </div>
        
        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
              message.type === 'success' 
                ? 'bg-green-900/20 text-green-400 border border-green-500/20' 
                : 'bg-red-900/20 text-red-400 border border-red-500/20'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {message.text}
          </motion.div>
        )}
        
        {/* Use Cashback Section */}
        <div className="space-y-3">
          <div className="text-sm text-mali-text-secondary">Use Cashback</div>
          <div className="flex gap-2">
            <div className="relative flex-grow">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-mali-text-secondary">
                $
              </div>
              <input
                type="text"
                value={amountInput}
                onChange={(e) => {
                  // Only allow numbers and one decimal point
                  const value = e.target.value.replace(/[^0-9.]/g, '');
                  if (value === '.' || value === '') {
                    setAmountInput(value);
                  } else {
                    // Check if there's only one decimal point
                    const decimalCount = (value.match(/\./g) || []).length;
                    if (decimalCount <= 1) {
                      setAmountInput(value);
                    }
                  }
                }}
                placeholder="0.00"
                className="w-full py-2 pl-8 pr-3 bg-mali-blue/10 border border-mali-blue/20 rounded-lg text-white focus:outline-none focus:border-mali-blue-accent"
              />
            </div>
            <button
              onClick={handleUseCashback}
              disabled={!amountInput || parseFloat(amountInput) <= 0 || parseFloat(amountInput) > totalCashback || isLoading}
              className="py-2 px-4 bg-mali-blue-accent text-white rounded-lg hover:bg-mali-blue-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Use'
              )}
            </button>
          </div>
          <div className="flex items-center gap-1 text-xs text-mali-text-secondary">
            <InfoIcon size={12} />
            Cashback can be used for any purchase on the platform
          </div>
        </div>
        
        {/* Cashback History */}
        <div className="pt-4 border-t border-mali-blue/20">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex justify-between items-center w-full text-sm"
          >
            <span className="font-medium text-white">Cashback History</span>
            <ChevronRight
              size={16}
              className={`text-mali-text-secondary transition-transform ${
                showHistory ? 'rotate-90' : ''
              }`}
            />
          </button>
          
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar"
            >
              {cashbacks.length === 0 ? (
                <div className="text-sm text-mali-text-secondary py-2">
                  No cashback history yet
                </div>
              ) : (
                cashbacks.map((cashback) => (
                  <div
                    key={cashback.id}
                    className="p-3 bg-mali-blue/5 border border-mali-blue/20 rounded-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="text-sm font-medium text-white">
                          ${cashback.amount.toFixed(2)}
                        </div>
                        <div className="text-xs text-mali-text-secondary flex items-center gap-1.5">
                          <Calendar size={12} />
                          {formatDate(cashback.createdAt)}
                        </div>
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        cashback.status === 'available' ? 'bg-green-900/30 text-green-400 border border-green-500/20' :
                        cashback.status === 'claimed' ? 'bg-blue-900/30 text-blue-400 border border-blue-500/20' :
                        cashback.status === 'pending' ? 'bg-amber-900/30 text-amber-400 border border-amber-500/20' :
                        'bg-mali-blue/20 text-mali-text-secondary border border-mali-blue/20'
                      }`}>
                        {cashback.status === 'available' ? 'Available' :
                          cashback.status === 'claimed' ? 'Claimed' :
                          cashback.status === 'pending' ? 'Pending' : 'Expired'}
                      </div>
                    </div>
                    <div className="text-xs text-mali-text-secondary mt-1.5">
                      From: {cashback.source === 'promotion' ? 'Promotion' : 
                            cashback.source === 'referral' ? 'Referral' : 'Loyalty Program'}
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
} 