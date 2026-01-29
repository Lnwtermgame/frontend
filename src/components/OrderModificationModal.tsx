"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from '@/lib/framer-exports';
import { 
  X, AlertCircle, CheckCircle, Clock, ShoppingCart, 
  CalendarClock, Info, ChevronDown, ArrowRight
} from 'lucide-react';

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  image?: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  isModifiable: boolean;
}

export interface OrderModificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    date: string;
    status: 'pending' | 'processing' | 'completed' | 'cancelled';
    items: OrderItem[];
    total: number;
    paymentMethod: string;
    isCancellable: boolean;
    cancellationReason?: string;
  };
  onModifyQuantity: (itemId: string, quantity: number) => Promise<void>;
  onRemoveItem: (itemId: string) => Promise<void>;
  onCancelOrder: (reason: string) => Promise<void>;
}

export function OrderModificationModal({
  isOpen,
  onClose,
  order,
  onModifyQuantity,
  onRemoveItem,
  onCancelOrder
}: OrderModificationModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<'summary' | 'modify' | 'cancel'>('summary');
  const [cancellationReason, setCancellationReason] = useState('');
  const [modifiedItems, setModifiedItems] = useState<{[key: string]: number}>({});
  const [removedItems, setRemovedItems] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const canModifyOrder = order.status === 'pending' || order.status === 'processing';
  const canCancelOrder = order.isCancellable && (order.status === 'pending' || order.status === 'processing');
  
  const handleQuantityChange = (itemId: string, quantity: number) => {
    setModifiedItems(prev => ({
      ...prev,
      [itemId]: quantity
    }));
  };
  
  const handleRemoveItem = (itemId: string) => {
    if (removedItems.includes(itemId)) {
      setRemovedItems(prev => prev.filter(id => id !== itemId));
    } else {
      setRemovedItems(prev => [...prev, itemId]);
    }
  };
  
  const handleSubmitModifications = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // Process quantity modifications
      for (const [itemId, quantity] of Object.entries(modifiedItems)) {
        await onModifyQuantity(itemId, quantity);
      }
      
      // Process item removals
      for (const itemId of removedItems) {
        await onRemoveItem(itemId);
      }
      
      setSuccessMessage('Your order has been successfully updated!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMessage('Failed to update your order. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleSubmitCancellation = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      await onCancelOrder(cancellationReason);
      setSuccessMessage('Your order has been successfully cancelled.');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setErrorMessage('Failed to cancel your order. Please try again or contact support.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Show the appropriate panel based on the active step
  const renderContent = () => {
    switch (activeStep) {
      case 'modify':
        return (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Modify Order Items</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {order.items.map(item => (
                <div 
                  key={item.id} 
                  className={`bg-mali-navy p-4 rounded-lg border ${
                    removedItems.includes(item.id) ? 'border-red-500/50' : 'border-mali-blue/20'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-medium text-white">{item.name}</h4>
                    <span className="text-mali-text-secondary text-sm">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>
                  
                  {!item.isModifiable ? (
                    <div className="bg-mali-blue/10 p-2 rounded flex items-center text-mali-text-secondary text-sm">
                      <Info size={14} className="mr-2" />
                      <span>This item cannot be modified</span>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <button
                          className={`px-3 py-1 rounded-l-md ${
                            removedItems.includes(item.id) 
                              ? 'bg-red-500/20 text-red-400' 
                              : 'bg-mali-blue/20 text-mali-blue-light'
                          }`}
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          {removedItems.includes(item.id) ? 'Undo Remove' : 'Remove'}
                        </button>
                        
                        {!removedItems.includes(item.id) && (
                          <div className="flex border border-mali-blue/20 rounded-r-md overflow-hidden">
                            <button
                              className="bg-mali-blue/10 text-white px-3 py-1"
                              onClick={() => handleQuantityChange(item.id, Math.max(1, (modifiedItems[item.id] || item.quantity) - 1))}
                            >
                              -
                            </button>
                            <span className="bg-mali-blue/20 text-white px-4 py-1 flex items-center">
                              {modifiedItems[item.id] !== undefined ? modifiedItems[item.id] : item.quantity}
                            </span>
                            <button
                              className="bg-mali-blue/10 text-white px-3 py-1"
                              onClick={() => handleQuantityChange(item.id, (modifiedItems[item.id] || item.quantity) + 1)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-mali-text-secondary">
                        Original: {item.quantity}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <div className="mt-6 flex justify-between">
              <button
                className="bg-mali-blue/20 text-mali-text-secondary hover:text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setActiveStep('summary')}
                disabled={isProcessing}
              >
                Back
              </button>
              
              <button
                className="bg-mali-blue-light hover:bg-mali-blue-light/90 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                onClick={handleSubmitModifications}
                disabled={isProcessing || (Object.keys(modifiedItems).length === 0 && removedItems.length === 0)}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Processing...
                  </>
                ) : (
                  <>
                    Save Changes
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        );
        
      case 'cancel':
        return (
          <div>
            <h3 className="text-lg font-bold text-white mb-4">Cancel Order</h3>
            <p className="text-mali-text-secondary mb-4">
              Please provide a reason for cancellation. This helps us improve our service.
            </p>
            
            <div className="mb-4">
              <label className="block text-mali-text-secondary text-sm mb-2">
                Cancellation Reason
              </label>
              <select
                value={cancellationReason}
                onChange={e => setCancellationReason(e.target.value)}
                className="w-full bg-mali-navy border border-mali-blue/20 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-mali-blue-light"
              >
                <option value="">Select a reason</option>
                <option value="changed_mind">Changed my mind</option>
                <option value="found_better_price">Found a better price elsewhere</option>
                <option value="mistake">Ordered by mistake</option>
                <option value="payment_issue">Having payment issues</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {cancellationReason === 'other' && (
              <div className="mb-4">
                <label className="block text-mali-text-secondary text-sm mb-2">
                  Please specify
                </label>
                <textarea
                  className="w-full bg-mali-navy border border-mali-blue/20 rounded-md px-4 py-2.5 text-white focus:outline-none focus:border-mali-blue-light h-24 resize-none"
                  placeholder="Please provide more details..."
                />
              </div>
            )}
            
            <div className="bg-mali-blue/10 border border-mali-blue/20 rounded-md p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="text-mali-blue-light mr-3 mt-0.5" size={16} />
                <div className="text-sm text-mali-text-secondary">
                  <p className="mb-1">Please note:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Cancellation may take up to 24 hours to process</li>
                    <li>Refunds will be issued to your original payment method</li>
                    <li>Digital goods that have been redeemed cannot be refunded</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                className="bg-mali-blue/20 text-mali-text-secondary hover:text-white px-4 py-2 rounded-md transition-colors"
                onClick={() => setActiveStep('summary')}
                disabled={isProcessing}
              >
                Back
              </button>
              
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md transition-colors flex items-center"
                onClick={handleSubmitCancellation}
                disabled={isProcessing || !cancellationReason}
              >
                {isProcessing ? (
                  <>
                    <span className="animate-spin mr-2">⌛</span>
                    Processing...
                  </>
                ) : (
                  <>
                    Cancel Order
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </button>
            </div>
          </div>
        );
        
      default: // summary
        return (
          <div>
            <h3 className="text-lg font-bold text-white mb-2">Order #{order.id}</h3>
            <p className="text-mali-text-secondary mb-4">
              Placed on {new Date(order.date).toLocaleDateString()}
            </p>
            
            <div className="flex space-x-1 mb-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                order.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                order.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                order.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                'bg-red-500/20 text-red-400'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-2 mb-6">
              <div className="flex justify-between py-2 border-b border-mali-blue/10">
                <span className="text-mali-text-secondary">Payment Method</span>
                <span className="text-white">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-mali-blue/10">
                <span className="text-mali-text-secondary">Total</span>
                <span className="text-white font-medium">${order.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-mali-blue/10">
                <span className="text-mali-text-secondary">Items</span>
                <span className="text-white">{order.items.length}</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4 mb-6">
              {canModifyOrder && (
                <button
                  className="bg-mali-blue/20 hover:bg-mali-blue/30 text-mali-blue-light px-4 py-3 rounded-md transition-colors w-full text-center flex items-center justify-center"
                  onClick={() => setActiveStep('modify')}
                >
                  <ShoppingCart size={18} className="mr-2" />
                  Modify Items
                </button>
              )}
              
              {canCancelOrder && (
                <button
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-3 rounded-md transition-colors w-full text-center flex items-center justify-center"
                  onClick={() => setActiveStep('cancel')}
                >
                  <X size={18} className="mr-2" />
                  Cancel Order
                </button>
              )}
            </div>
          </div>
        );
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div 
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div 
          className="w-full max-w-lg bg-mali-card border border-mali-blue/30 rounded-xl shadow-big z-10 m-4"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center p-5 border-b border-mali-blue/20">
            <h2 className="text-xl font-bold text-white">
              {activeStep === 'summary' ? 'Order Details' : 
               activeStep === 'modify' ? 'Modify Order' : 
               'Cancel Order'}
            </h2>
            
            <button 
              onClick={onClose}
              className="text-mali-text-secondary hover:text-white transition-colors"
              disabled={isProcessing}
            >
              <X size={20} />
            </button>
          </div>
          
          {/* Modal Body */}
          <div className="p-5">
            {successMessage ? (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <CheckCircle size={32} className="text-green-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Success!</h3>
                <p className="text-mali-text-secondary">{successMessage}</p>
              </div>
            ) : errorMessage ? (
              <div className="text-center py-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertCircle size={32} className="text-red-500" />
                </motion.div>
                <h3 className="text-xl font-bold text-white mb-2">Error</h3>
                <p className="text-mali-text-secondary">{errorMessage}</p>
                <button
                  className="bg-mali-blue-light text-white px-4 py-2 rounded-md mt-4"
                  onClick={() => setErrorMessage(null)}
                >
                  Try Again
                </button>
              </div>
            ) : (
              renderContent()
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
} 
